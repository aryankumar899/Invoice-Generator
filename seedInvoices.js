import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Invoice from './models/Invoice.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/invoice-ai');
    const userId = '69dd3ee9e12de577446a80e8';
    
    const dummyInvoices = [];
    const statuses = ['Pending', 'Paid', 'Overdue'];
    
    for (let i = 0; i < 10; i++) {
      dummyInvoices.push({
        user: userId,
        invoiceId: `INV-2026-${1000 + Math.floor(Math.random() * 9000)}`,
        clientName: `Alpha Corp ${i + 1}`,
        clientEmail: `billing.alpha${i}@example.com`,
        clientAddress: `${500 + i * 2} Madison Avenue, Suite ${(i + 1) * 10}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
        notes: "Thank you for partnering with us!",
        items: [
          { desc: "SaaS Enterprise License", qty: 1, rate: 1500 },
          { desc: "Implementation Support", qty: Math.floor(Math.random() * 20), rate: 150 }
        ],
        tax: 5,
        bankDetails: { bankName: "Chase Bank", accountName: "SaaS Provider LLC" },
        status: statuses[i % 3],
        totalAmount: 2000 + Math.floor(Math.random() * 3000)
      });
    }
    
    await Invoice.insertMany(dummyInvoices);
    console.log("SUCCESS: Seeded 10 dummy invoices for testing!");
    process.exit();
  } catch (error) {
    console.error("Error seeding invoices:", error);
    process.exit(1);
  }
}

seed();
