import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

console.log(process.env.SMTP_HOST);
console.log(process.env.SMTP_PORT);

import transporter from '../services/mailServices.js';

try {
  await transporter.sendMail({
    from: process.env.SMTP_EMAIL,
    to: process.env.SMTP_EMAIL,
    subject: 'Test',
    html: '<h1>Hello</h1>',
  });

  console.log('sent');
} catch (error) {
  console.log(error.message);
}
