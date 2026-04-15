import express from 'express';
import { register, login, getMe, resetPasswordDirectly, updateProfile } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/signup', register); // Alias for register
router.post('/login', login);
router.put('/resetpassword', resetPasswordDirectly);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

export default router;
