import express from 'express';
import { getInvoices, createInvoice, updateInvoiceStatus, deleteInvoice, getInvoiceById, updateInvoice } from '../controllers/invoiceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getInvoices)
  .post(protect, createInvoice);

router.route('/:id/status')
  .put(protect, updateInvoiceStatus);

router.route('/:id')
  .get(protect, getInvoiceById)
  .put(protect, updateInvoice)
  .delete(protect, deleteInvoice);

export default router;
