//dependencies
import express from 'express';

//controllers
import {
  getXRPBalance,
  getMyETHBalance,
} from '../controllers/walletController.js';

//middleware
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

//get balance router
router.get('/xrp/balance', protect, getXRPBalance);
router.get('/eth/balance', protect, getMyETHBalance);

export default router;
