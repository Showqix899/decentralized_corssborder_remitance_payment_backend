import { Queue } from 'bullmq';

import redisConnection from '../config/redis.js';

//email queue
const emailQueue = new Queue('emailQueue', {
  connection: redisConnection,
});

export default emailQueue;
