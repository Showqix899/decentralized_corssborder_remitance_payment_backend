import { Queue } from 'bullmq';
import redisConnection from '../config/redis.js';

const ethereumQueue = new Queue('ethereumPaymentQueue', {
  connection: redisConnection,
});

export default ethereumQueue;
