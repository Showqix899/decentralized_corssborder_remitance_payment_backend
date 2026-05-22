//dependencies
import { Worker } from 'bullmq';
//config
import redisConnection from '../config/redis.js';
//services
import transporter from '../services/mailServices.js';

//.env loading
import dotenv from 'dotenv';
dotenv.config();

//worker logic
const emailWorker = new Worker(
  'emailQueue',
  async (job) => {
    const { to, subject, html } = job.data;

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to,
      subject,
      html,
    });
    console.log('Email is sent');
  },
  {
    connection: redisConnection,
  }
);

// Add error listeners to see exactly what goes wrong if it fails
emailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});
