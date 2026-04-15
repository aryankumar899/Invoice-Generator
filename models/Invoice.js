import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  invoiceId: {
    type: String,
    required: true,
  },
  clientName: { type: String, required: true },
  clientEmail: { type: String },
  clientAddress: { type: String },
  billFrom: {
    name: { type: String, default: '' },
    companyName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' }
  },
  date: { type: Date, required: true },
  dueDate: { type: Date },
  notes: { type: String },
  items: [
    {
      desc: { type: String },
      qty: { type: Number },
      rate: { type: Number },
    }
  ],
  tax: { type: Number, default: 0 },
  bankDetails: {
    bankName: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
    routingNumber: { type: String }
  },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Overdue'],
    default: 'Pending'
  },
  totalAmount: {
    type: Number,
    required: true
  }
}, { timestamps: true });

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;
