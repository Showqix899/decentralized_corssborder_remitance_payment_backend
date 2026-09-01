import express from 'express';

import {
  getUserLedgers,
  searchLedgers,
  getLedgerDetails,
} from '../controllers/ledgerController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current user's ledgers
router.get('/', protect, getUserLedgers);

// Search current user's ledgers
router.get('/search', protect, searchLedgers);

// Ledger details
router.get('/:identifier', protect, getLedgerDetails);

export default router;
