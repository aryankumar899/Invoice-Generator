import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { extractInvoice } from '../controllers/aiController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^(image\/(jpeg|png|webp|gif)|application\/pdf)$/.test(file.mimetype);
    cb(ok ? null : new Error('Only JPG, PNG, WEBP, GIF, or PDF files are allowed.'), ok);
  },
});

const router = express.Router();
router.post('/extract', protect, upload.single('file'), extractInvoice);

export default router;
