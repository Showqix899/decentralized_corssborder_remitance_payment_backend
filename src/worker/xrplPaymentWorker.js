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
import { sendXRP } from '../services/xrplService.js';
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
        senderSeed: sender.wallet.seed,

        destination: receiver.wallet.address,

        amount,
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

      const ledgerIndex = transferResult.result.result.validated_ledger_index;

      const networkFeeDrops = transferResult.networkFeeDrops;

      const networkFeeXRP = Number(transferResult.networkFeeXRP);

      // SAVE TRANSACTION
      const transection = await Transection.create({
        sender: freshSender._id,

        receiver: freshReceiver._id,

        senderAddress: freshSender.wallet.address,

        receiverAddress: freshReceiver.wallet.address,

        senderCountry: freshSender.country,

        receiverCountry: freshReceiver.country,

        // ORIGINAL
        amount,

        // FX DATA
        sourceCurrency,

        destinationCurrency,

        exchangeRate,

        convertedAmount,

        fxFee,

        totalDeducted,

        // BLOCKCHAIN
        currency: 'XRP',

        txHash,

        ledgerIndex,

        // FEES
        networkFeeDrops,

        networkFeeXRP,

        // TIMING
        initiatedAt,

        completedAt,

        processingTimeMs,

        processingTimeSeconds,

        swiftMessageType: swiftMessage.messageType,

        swiftMessageId: swiftMessage.messageId,

        amlStatus,
        riskScore: amlResult.riskScore,

        amlReasons: amlResult.reasons,

        status: 'completed',
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
