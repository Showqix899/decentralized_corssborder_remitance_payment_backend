import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';

import connectDB from '../config/db.js';
import redisConnection from '../config/redis.js';

import User from '../models/User.js';
import EthereumTransaction from '../models/EthereumTransection.js';
import ComplianceLog from '../models/ComplianceLog.js';

import { sendETH, getETHBalance } from '../services/ethereumService.js';

import {
  getExchangeInfo,
  calculateFXFee,
  getETHPrice,
  getETHPriceUSD,
} from '../services/exchangeRateService.js';

import { runAMLChecks, determineAMLStatus } from '../services/amlService.js';

import { generateSwiftMXMessage } from '../services/swiftMXServices.js';

// connect db
connectDB();

// ethereum worker
const ethereumWorker = new Worker(
  'ethereumPaymentQueue',

  async (job) => {
    try {
      const { sender, receiver, amount, sourceCurrency, destinationCurrency } =
        job.data;

      const freshSender = await User.findById(sender._id);

      const freshReceiver = await User.findById(receiver._id);

      if (!freshSender) {
        throw new Error('Sender not found');
      }

      if (!freshReceiver) {
        throw new Error('Receiver not found');
      }

      if (!freshSender.balances.has(sourceCurrency)) {
        freshSender.balances.set(sourceCurrency, 0);
      }

      if (!freshReceiver.balances.has(destinationCurrency)) {
        freshReceiver.balances.set(destinationCurrency, 0);
      }

      // FX DATA

      const exchangeInfo = await getExchangeInfo(
        sourceCurrency,
        destinationCurrency,
        amount
      );

      const exchangeRate = exchangeInfo.exchangeRate;

      const convertedAmount = exchangeInfo.convertedAmount;

      // ETH PRICE

      const ethPrice = await getETHPrice(sourceCurrency.toLowerCase());

      const ethPriceUSD = await getETHPriceUSD();

      const cryptoAmountSent = Number(amount) / Number(ethPrice);

      // FX FEE

      const fxFee = calculateFXFee(amount);

      const totalDeducted = Number(amount) + Number(fxFee);

      const userETHBalance = await getETHBalance(
        freshSender.wallets.ethereum.address
      );

      if (Number(cryptoAmountSent) > Number(userETHBalance)) {
        throw new Error('Insufficient Balance');
      }

      // AML

      const amlResult = await runAMLChecks({
        sender: freshSender,
        receiver: freshReceiver,
        amount,
      });

      const amlStatus = determineAMLStatus(amlResult.riskScore);

      if (amlStatus === 'blocked') {
        throw new Error('AML Blocked');
      }

      if (amlStatus === 'under_review') {
        throw new Error('AML Review Required');
      }

      // SWIFT MX

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

      const initiatedAt = new Date();

      const startTime = Date.now();

      // SEND ETH

      const result = await sendETH({
        senderPrivateKey: sender.wallets.ethereum.privateKey,

        destination: receiver.wallets.ethereum.address,

        amount: cryptoAmountSent.toFixed(8),
      });

      //test

      const completedAt = new Date();

      const endTime = Date.now();

      const processingTimeMs = endTime - startTime;

      const processingTimeSeconds = processingTimeMs / 1000;

      // FEES

      const networkFeeETH = result.networkFeeETH;

      const networkFeeSourceCurrency = networkFeeETH * ethPrice;

      const networkFeeUSD = networkFeeETH * ethPriceUSD;

      const totalCostUSD =
        Number(amount) *
          (await getExchangeInfo(sourceCurrency, 'USD', 1)).exchangeRate +
        networkFeeUSD;

      // BALANCES

      freshSender.balances.set(
        sourceCurrency,
        freshSender.balances.get(sourceCurrency) - totalDeducted
      );

      freshReceiver.balances.set(
        destinationCurrency,
        freshReceiver.balances.get(destinationCurrency) + convertedAmount
      );

      await freshSender.save();
      await freshReceiver.save();

      // SAVE TX

      await EthereumTransaction.create({
        sender: freshSender._id,

        receiver: freshReceiver._id,

        settlementNetwork: 'ETHEREUM',

        senderAddress: freshSender.wallets.ethereum.address,

        receiverAddress: freshReceiver.wallets.ethereum.address,

        senderCountry: freshSender.country,

        receiverCountry: freshReceiver.country,

        amount,

        sourceCurrency,

        destinationCurrency,

        exchangeRate,

        convertedAmount,

        cryptoAmountSent,

        cryptoPrice: ethPrice,

        fxFee,

        totalDeducted,

        txHash: result.txHash,

        blockNumber: result.blockNumber,

        gasUsed: result.gasUsed,

        gasPrice: result.gasPrice,

        networkFeeETH,

        networkFeeSourceCurrency,

        networkFeeUSD,

        totalCostUSD,

        initiatedAt,

        completedAt,

        processingTimeMs,

        processingTimeSeconds,

        amlStatus,

        riskScore: amlResult.riskScore,

        amlReasons: amlResult.reasons,

        swiftMessageType: swiftMessage.messageType,

        swiftMessageId: swiftMessage.messageId,

        status: 'completed',
      });

      console.log('ETH transfer complete');
    } catch (error) {
      console.log('Ethereum Worker Error:', error.message);

      throw error;
    }
  },

  {
    connection: redisConnection,
  }
);

ethereumWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

ethereumWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} failed`);

  console.log(err);
});
