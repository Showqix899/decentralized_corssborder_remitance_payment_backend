import express from 'express';

import {
  compareNetworks,
  getTransactionAnalytics,
} from '../controllers/transectionAnalyticsContorller.js';

const router = express.Router();

//get analytics
router.get('/compare-networks', compareNetworks);
router.get('/', getTransactionAnalytics);

export default router;
