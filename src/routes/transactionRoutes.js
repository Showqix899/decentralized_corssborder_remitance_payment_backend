import express from 'express';

import {
  sendMoney,
  getTransections,
  getTransactionAnalytics,
  getTransectionById,
} from '../controllers/transectionController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// send money
router.post('/send', protect, sendMoney);
// history
router.get('/history', protect, getTransections);
//transection analytical
router.get('/analytics', getTransactionAnalytics);

//get transection by id
router.get('/:id', protect, getTransectionById);

export default router;
