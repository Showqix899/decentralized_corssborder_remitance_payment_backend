import express from 'express';
import {
  getUserProfile,
  updateDefaultCurrency,
} from '../controllers/userProfileController.js';

import { protect } from '../middleware/authMiddleware.js';
const router = express.Router();

// get user profile
router.get('/profile', protect, getUserProfile);
router.patch('/profile/currency', protect, updateDefaultCurrency);

export default router;
