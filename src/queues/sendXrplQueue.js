import { Queue } from 'bullmq';

import redisConnection from '../config/redis.js';

//xrpl payment queue
const xrpleQueue = new Queue('xrplPaymentQueue', {
  connection: redisConnection,
});

export default xrpleQueue;
