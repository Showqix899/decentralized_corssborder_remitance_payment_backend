import express from 'express';

import {
  sendMoney,
  getTransections,
} from '../controllers/transectionController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// send money
router.post('/send', protect, sendMoney);

// history
router.get('/history', protect, getTransections);

export default router;
