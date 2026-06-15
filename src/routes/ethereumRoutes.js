import express from 'express';

import { sendETHMoney } from '../controllers/ethereumController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send', protect, sendETHMoney);

export default router;
