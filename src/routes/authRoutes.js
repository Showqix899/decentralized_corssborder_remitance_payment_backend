import express from 'express';

//controller functions
import {
  registerUser,
  verifyEmail,
  loginUser,
  resetPasswordRequest,
  resetPassword,
} from '../controllers/auth.controller.js';

const router = express.Router();

//auth routes
router.post('/register', registerUser);
router.get('/verify-email/:token', verifyEmail);
router.post('/login', loginUser);
router.post('/password-reset-request', resetPasswordRequest);
router.post('/reset-password/:token', resetPassword);

export default router;
