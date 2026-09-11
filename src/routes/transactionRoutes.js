import express from 'express';

import {
  sendMoney,
  getTransections,
  getTransactionAnalytics,
  getTransectionById,
  getSwiftMessageById,
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

//get swift message by id
router.get('/swift/:id', protect, getSwiftMessageById);

export default router;
