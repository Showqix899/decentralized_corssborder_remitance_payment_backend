import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'bullmq';

import connectDB from '../config/db.js';

import redisConnection from '../config/redis.js';

import User from '../models/User.js';

import EthereumTransaction from '../models/EthereumTransection.js';

import { sendETH } from '../services/ethereumService.js';

//connect db
connectDB();

//ethereum worker
const ethereumWorker = new Worker(
  'ethereumPaymentQueue',

  async (job) => {
    const { sender, receiver, amount } = job.data;

    console.log('ETH transfer started');

    const initiatedAt = new Date();

    const startTime = Date.now();

    const result = await sendETH({
      senderPrivateKey: sender.wallets.ethereum.privateKey,

      destination: receiver.wallets.ethereum.address,

      amount,
    });

    const completedAt = new Date();

    const endTime = Date.now();

    const processingTimeMs = endTime - startTime;

    const processingTimeSeconds = processingTimeMs / 1000;

    await EthereumTransaction.create({
      sender: sender._id,

      receiver: receiver._id,

      senderAddress: sender.wallets.ethereum.address,

      receiverAddress: receiver.wallets.ethereum.address,

      amount,

      txHash: result.txHash,

      blockNumber: result.blockNumber,

      gasUsed: result.gasUsed,

      gasPrice: result.gasPrice,

      networkFeeETH: result.networkFeeETH,

      initiatedAt,

      completedAt,

      processingTimeMs,

      processingTimeSeconds,

      status: 'completed',
    });

    console.log('ETH transfer complete');
  },

  {
    connection: redisConnection,
  }
);

//events
ethereumWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

ethereumWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} failed`);

  console.log(err);
});
