//dependencies
import express from 'express';

//controllers
import { getBalance } from '../controllers/walletController.js';

//middleware
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

//get balance router
router.get('/balance', protect, getBalance);

export default router;
