import express from 'express';

import { compareNetworks } from '../controllers/transectionAnalyticsContorller.js';

const router = express.Router();

//get analytics
router.get('/compare-networks', compareNetworks);

export default router;
