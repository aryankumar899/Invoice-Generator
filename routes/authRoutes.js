import express from 'express';
import { register, login, getMe, resetPasswordDirectly, updateProfile, googleAuth } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/signup', register); // Alias for register
router.post('/login', login);
router.post('/google', googleAuth);         // Google OAuth
router.put('/resetpassword', resetPasswordDirectly);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;

