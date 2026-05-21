//dependencies
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

//database connection
import connectDB from './src/config/db.js';

//routes
import authRoutes from './src/routes/authRoutes.js';
import walletRoutes from './src/routes/walletRoutes.js';

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

//running the app on port {PORT}
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
