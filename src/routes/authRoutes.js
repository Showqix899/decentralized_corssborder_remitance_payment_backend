import express from 'express';

import {
  registerUser,
  verifyEmail,
  loginUser,
} from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);

export default router;
