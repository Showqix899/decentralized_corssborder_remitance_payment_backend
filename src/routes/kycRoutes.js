import express from 'express';

import {
  getPendingsKYC,
  approveKYC,
  rejectKYC,
  getKYCDetails,
  approveKYCWithNID,
} from '../controllers/kycController.js';

//middlewares
import { isAdmin, protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/imageHandler.js';

const router = express.Router();

// all pending KYC
router.get('/kyc/pending', protect, isAdmin, getPendingsKYC);

// single KYC details
router.get('/kyc/:userId', protect, isAdmin, getKYCDetails);

// approve
router.patch('/kyc/:userId/approve', protect, isAdmin, approveKYC);

// reject
router.patch('/kyc/:userId/reject', protect, isAdmin, rejectKYC);

// approve with NIDLive
router.post(
  '/kyc/approve/nid',
  protect,
  upload.fields([
    { name: 'nid_front', maxCount: 1 },
    { name: 'nid_back', maxCount: 1 },
    { name: 'selfie', maxCount: 1 },
  ]),
  approveKYCWithNID
);

export default router;
