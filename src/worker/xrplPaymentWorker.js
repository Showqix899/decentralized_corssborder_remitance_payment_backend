// ENV
import dotenv from 'dotenv';
dotenv.config();

// DEPENDENCIES
import { Worker } from 'bullmq';

// REDIS
import redisConnection from '../config/redis.js';

// DB
import connectDB from '../config/db.js';

// SERVICES
import {
  sendXRP,
  getWalletBalance,
  getLedgerInfo,
} from '../services/xrplService.js';
import {
  getXRPPrice,
  getXRPPriceUSD,
} from '../services/exchangeRateService.js';
import {
  getExchangeInfo,
  calculateFXFee,
} from '../services/exchangeRateService.js';
import { runAMLChecks, determineAMLStatus } from '../services/amlService.js';
import { generateSwiftMXMessage } from '../services/swiftMXServices.js';

// MODELS
import User from '../models/User.js';
import Transection from '../models/Transection.js';
import ComplianceLog from '../models/ComplianceLog.js';
import TestNetLedger from '../models/Ledger.js';

// CONNECT DB
connectDB();

// WORKER
const xrplPaymentWorker = new Worker(
  'xrplPaymentQueue',

  async (job) => {
    try {
      // JOB DATA
      const {
        receiver,

        sender,

        amount,

        sourceCurrency,

        destinationCurrency,
      } = job.data;

      // REFRESH USERS
      const freshSender = await User.findById(sender._id);

      const freshReceiver = await User.findById(receiver._id);

      // USER VALIDATION
      if (!freshSender) {
        throw new Error('Sender not found');
      }

      if (!freshReceiver) {
        throw new Error('Receiver not found');
      }

      // INITIALIZE BALANCES
      if (!freshSender.balances.has(sourceCurrency)) {
        freshSender.balances.set(sourceCurrency, 0);
      }

      if (!freshReceiver.balances.has(destinationCurrency)) {
        freshReceiver.balances.set(destinationCurrency, 0);
      }

      // GET LIVE FX DATA
      const exchangeInfo = await getExchangeInfo(
        sourceCurrency,
        destinationCurrency,
        amount
      );

      const exchangeRate = exchangeInfo.exchangeRate;

      const convertedAmount = exchangeInfo.convertedAmount;

      // XRP price in source currency
      const xrpPrice = await getXRPPrice(sourceCurrency.toLowerCase());

      //XRP price in price in usd
      const xrpPriceUSD = await getXRPPriceUSD();

      // Convert fiat amount to XRP
      const cryptoAmountSent = Number(amount) / Number(xrpPrice);

      // Current wallet balance
      const senderXRPBalance = Number(
        await getWalletBalance(freshSender.wallets.xrpl.address)
      );

      // Reserve some XRP for transaction fee
      const estimatedNetworkFee = 0.001; // XRP

      const requiredXRP = Number(cryptoAmountSent) + estimatedNetworkFee;

      if (senderXRPBalance < requiredXRP) {
        throw new Error(
          `Insufficient XRP wallet balance. Required ${requiredXRP} XRP, Available ${senderXRPBalance} XRP`
        );
      }

      // FX FEE
      const fxFee = calculateFXFee(amount);

      // TOTAL DEDUCTED
      const totalDeducted = Number(amount) + Number(fxFee);

      // BALANCE CHECK
      if (freshSender.balances.get(sourceCurrency) < totalDeducted) {
        throw new Error('Insufficient balance');
      }

      // TRANSACTION START TIME
      const initiatedAt = new Date();

      const startTime = Date.now();

      //aml result
      const amlResult = await runAMLChecks({
        sender: freshSender,
        receiver: freshReceiver,
        amount,
      });

      // aml status
      const amlStatus = determineAMLStatus(amlResult.riskScore);

      //check status
      if (amlStatus === 'blocked') {
        //update sender aml status
        freshSender.amlStatus = 'blocked';
        freshSender.amlReasons = amlResult.reasons;
        await freshSender.save();

        throw new Error('Transaction blocked due to AML risk');
      }

      if (amlStatus === 'under_review') {
        //update sender aml status
        freshSender.amlStatus = 'under_review';
        freshSender.amlReasons = amlResult.reasons;
        await freshSender.save();

        throw new Error('Transaction under review due to AML risk');
      }

      freshSender.amlStatus = 'clear';
      freshSender.amlReasons = [];
      await freshSender.save();

      const swiftMessage = generateSwiftMXMessage({
        sender: freshSender,

        receiver: freshReceiver,

        amount,

        sourceCurrency,

        destinationCurrency,
      });

      await ComplianceLog.create({
        sender: freshSender._id,

        receiver: freshReceiver._id,

        riskScore: amlResult.riskScore,

        amlStatus,

        reasons: amlResult.reasons,
      });

      /*
        IMPORTANT:

        XRPL TRANSFER SHOULD BE XRP.

        So here we simulate settlement
        using XRP blockchain.

        Later we can build REAL
        XRP bridge conversion.
      */

      // BLOCKCHAIN TRANSFER

      const transferResult = await sendXRP({
        senderSeed: sender.wallets.xrpl.seed,

        destination: receiver.wallets.xrpl.address,

        amount: cryptoAmountSent.toFixed(6),
      });

      // TRANSACTION END TIME
      const completedAt = new Date();

      const endTime = Date.now();

      // PROCESSING TIME
      const processingTimeMs = endTime - startTime;

      const processingTimeSeconds = processingTimeMs / 1000;

      // UPDATE SENDER BALANCE
      freshSender.balances.set(
        sourceCurrency,

        freshSender.balances.get(sourceCurrency) - totalDeducted
      );

      // UPDATE RECEIVER BALANCE
      freshReceiver.balances.set(
        destinationCurrency,

        freshReceiver.balances.get(destinationCurrency) + convertedAmount
      );

      // SAVE USERS
      await freshSender.save();

      await freshReceiver.save();

      // XRPL DETAILS
      const txHash = transferResult.result.result.hash;

      const ledgerIndex = transferResult.result.result.ledger_index;

      const networkFeeDrops = transferResult.networkFeeDrops;

      const networkFeeXRP = Number(transferResult.networkFeeXRP);

      const networkFeeSourceCurrency = networkFeeXRP * xrpPrice;

      const networkFeeUSD = networkFeeXRP * xrpPriceUSD;

      const totalCostUSD =
        Number(amount) *
          (await getExchangeInfo(sourceCurrency, 'USD', 1)).exchangeRate +
        networkFeeUSD;

      // SAVE TRANSACTION
      const transection = await Transection.create({
        sender: freshSender._id,

        receiver: freshReceiver._id,

        settlementNetwork: 'XRP',

        senderAddress: freshSender.wallets.xrpl.address,

        receiverAddress: freshReceiver.wallets.xrpl.address,

        senderCountry: freshSender.country,

        receiverCountry: freshReceiver.country,

        amount,

        currency: 'XRP',

        txHash,

        initiatedAt,

        completedAt,

        processingTimeMs,

        processingTimeSeconds,

        networkFeeDrops,

        networkFeeXRP,

        ledgerIndex,

        sourceCurrency,

        destinationCurrency,

        exchangeRate,

        convertedAmount,

        cryptoAmountSent,

        cryptoPrice: xrpPrice,

        networkFeeSourceCurrency,

        networkFeeUSD,

        fxFee,

        totalDeducted,

        totalCostUSD,

        swiftMessageType: swiftMessage.messageType,

        swiftMessageId: swiftMessage.messageId,

        amlStatus,

        riskScore: amlResult.riskScore,

        amlReasons: amlResult.reasons,

        status: 'completed',
      });

      //geting ledger info
      const ldg_index = transferResult.result.result.ledger_index;
      const ldgInfo = await getLedgerInfo(ldg_index);

      const ledger = ldgInfo.ledger;

      //create ledger instance
      const ledgerInstance = await TestNetLedger.create({
        sender: sender._id,

        receiver: receiver._id,

        ledger_hash: ledger.ledger_hash,

        parent_ledger_hash: ledger.parent_hash,

        ledger_index: ledger.ledger_index,

        validated: ldgInfo.validated,

        close_time_human: ledger.close_time_human,

        close_time_iso: ledger.close_time_iso,

        transaction_hash: txHash,

        xrp_amount: cryptoAmountSent,

        source_currency: sourceCurrency,

        destination_currency: destinationCurrency,

        source_currency_amount: amount,

        destination_currency_amount: convertedAmount,

        sender_address: freshSender.wallets.xrpl.address,

        receiver_address: freshReceiver.wallets.xrpl.address,
      });

      console.log('Transaction completed:', transection._id);
    } catch (error) {
      console.log('Worker Error:', error.message);

      throw error;
    }
  },

  {
    connection: redisConnection,
  }
);

// EVENTS
xrplPaymentWorker.on(
  'completed',

  (job) => {
    console.log(`Job ${job.id} completed`);
  }
);

xrplPaymentWorker.on(
  'failed',

  (job, err) => {
    console.log(`Job ${job?.id} failed:`, err.message);
  }
);
