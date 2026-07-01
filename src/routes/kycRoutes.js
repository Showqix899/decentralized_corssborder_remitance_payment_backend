import express from 'express';

import {
  createKYCSession,
  diditWebhook,
} from '../controllers/kycController.js';

//middlewares
import { isAdmin, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

//didit kyc (session creation)
router.post('/session', protect, createKYCSession);
router.get('/didit-webhook', diditWebhook);

export default router;
