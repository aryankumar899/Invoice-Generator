import express from 'express';
import { register, login, getMe, forgotPassword, resetPassword, updateProfile, googleAuth } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/signup', register); // Alias for register
router.post('/login', login);
router.post('/google', googleAuth);         // Google OAuth
router.post('/forgotpassword', forgotPassword);
router.post('/forgot-password', forgotPassword);
router.put('/resetpassword/:token', resetPassword);
router.put('/reset-password/:token', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;

