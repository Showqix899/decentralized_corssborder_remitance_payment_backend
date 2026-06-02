//dependencies
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

//database connection
import connectDB from './src/config/db.js';

//routes
import authRoutes from './src/routes/authRoutes.js';
import walletRoutes from './src/routes/walletRoutes.js';
import transactionRoutes from './src/routes/transactionRoutes.js';
import kycRoutes from './src/routes/kycRoutes.js';

//dotenv injecting
dotenv.config();

//mongod db connect
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

//*************Routes************* */

//auth routes
app.use('/api/auth', authRoutes);

//wallet routes
app.use('/api/wallet', walletRoutes);

//transection routes
app.use('/api/transections', transactionRoutes);

//kyc (know your customer)
app.use('/api/admin', kycRoutes);

//running the app on port {PORT}
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
