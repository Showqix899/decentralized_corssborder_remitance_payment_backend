import express from 'express';

import {
  getPendingsKYC,
  approveKYC,
  rejectKYC,
  getKYCDetails,
} from '../controllers/kycController.js';

import { isAdmin, protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// all pending KYC
router.get('/kyc/pending', protect, isAdmin, getPendingsKYC);

// single KYC details
router.get('/kyc/:userId', protect, isAdmin, getKYCDetails);

// approve
router.patch('/kyc/:userId/approve', protect, isAdmin, approveKYC);

// reject
router.patch('/kyc/:userId/reject', protect, isAdmin, rejectKYC);

export default router;
