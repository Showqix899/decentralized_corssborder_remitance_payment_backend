//datenv loading
import dotenv from 'dotenv';
dotenv.config();

//dependencies
import { Worker } from 'bullmq';
import redisConnection from '../config/redis.js';

//services
import { sendXRP } from '../services/xrplService.js';

//config
import connectDB from '../config/db.js';

//connect db
connectDB();

//models
import User from '../models/User.js';
import Transection from '../models/Transection.js';

//worker logic
const xrplPaymentWorker = new Worker(
  'xrplPaymentQueue',
  async (job) => {
    //get the job data
    const { receiver, sender, amount } = job.data;

    //initiating timestamp
    const initiatedAt = new Date();

    const startTime = Date.now();

    //blockchain transfer
    const transferResult = await sendXRP({
      senderSeed: sender.wallet.seed,

      destination: receiver.wallet.address,

      amount,
    });

    //captureing time
    const completedAt = new Date();

    const endTime = Date.now();

    const processingTimeMs = endTime - startTime;

    const processingTimeSeconds = processingTimeMs / 1000;

    //transection txHash
    const txHash = transferResult.result.result.hash;

    //ledger
    const ledgerIndex = transferResult.result.result.validated_ledger_index;

    //network fees
    const networkFeeDrops = transferResult.networkFeeDrops;
    const networkFeeXRP = Number(transferResult.networkFeeXRP);

    //save transection
    const transection = await Transection.create({
      sender: sender._id,
      receiver: receiver._id,
      senderAddress: sender.wallet.address,
      receiverAddress: receiver.wallet.address,
      amount,
      currency: 'XRP',
      txHash,
      initiatedAt,
      completedAt,
      processingTimeMs,
      processingTimeSeconds,
      ledgerIndex,
      networkFeeDrops,
      networkFeeXRP,
      status: 'completed',
    });
  },
  {
    connection: redisConnection,
  }
);

xrplPaymentWorker.on('completed', (job) => {
  console.log(`job ${job.id} has completed !`);
});

xrplPaymentWorker.on('failed', (job) => {
  console.log(`job ${job.id} has failed !`);
});
