import express from 'express';

import {
  sendETHMoney,
  getTransectionsHistory,
} from '../controllers/ethereumController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', protect, sendETHMoney);
router.get('/history', protect, getTransectionsHistory);

export default router;
