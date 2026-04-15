import Invoice from '../models/Invoice.js';

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'User not authorized' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all invoices for a user
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create an invoice
// @route   POST /api/invoices
// @access  Private
export const createInvoice = async (req, res) => {
  try {
    const {
      invoiceId, clientName, clientEmail, clientAddress, billFrom,
      date, dueDate, notes, items, tax, bankDetails, status
    } = req.body;

    if (clientEmail) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(clientEmail)) {
        return res.status(400).json({ message: 'Please provide a valid client email address.' });
      }
    }

    if (!invoiceId) {
      return res.status(400).json({ message: 'Invoice ID is required.' });
    }

    const existingInvoice = await Invoice.findOne({ invoiceId, user: req.user._id });
    if (existingInvoice) {
      return res.status(400).json({ message: `An invoice with ID ${invoiceId} already exists.` });
    }

    const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.rate)), 0);
    const taxAmount = subtotal * (Number(tax) / 100);
    const totalAmount = subtotal + taxAmount;

    const invoice = new Invoice({
      user: req.user._id,
      invoiceId,
      clientName,
      clientEmail,
      clientAddress,
      billFrom: billFrom || {},
      date,
      dueDate,
      notes,
      items,
      tax,
      bankDetails,
      status: status || 'Pending',
      totalAmount
    });

    const createdInvoice = await invoice.save();
    res.status(201).json(createdInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id/status
// @access  Private
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check user
    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    if (status) {
      invoice.status = status;
    }

    const updatedInvoice = await invoice.save();
    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
    if (invoice.user.toString() !== req.user._id.toString()) return res.status(401).json({ message: 'User not authorized' });

    const {
      invoiceId, clientName, clientEmail, clientAddress, billFrom,
      date, dueDate, notes, items, tax, bankDetails, status
    } = req.body;

    if (clientEmail) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(clientEmail)) {
        return res.status(400).json({ message: 'Please provide a valid client email address.' });
      }
    }

    if (invoiceId) {
      const existingInvoice = await Invoice.findOne({ invoiceId, user: req.user._id });
      if (existingInvoice && existingInvoice._id.toString() !== req.params.id) {
        return res.status(400).json({ message: `An invoice with ID ${invoiceId} already exists.` });
      }
    }

    const subtotal = items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.rate)), 0);
    const taxAmount = subtotal * (Number(tax) / 100);
    const totalAmount = subtotal + taxAmount;

    invoice.invoiceId = invoiceId;
    invoice.clientName = clientName;
    invoice.clientEmail = clientEmail;
    invoice.clientAddress = clientAddress;
    invoice.billFrom = billFrom || invoice.billFrom;
    invoice.date = date;
    invoice.dueDate = dueDate;
    invoice.notes = notes;
    invoice.items = items;
    invoice.tax = tax;
    invoice.bankDetails = bankDetails;
    if (status) invoice.status = status;
    invoice.totalAmount = totalAmount;

    const updatedInvoice = await invoice.save();
    res.json(updatedInvoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Private
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Check user
    if (invoice.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await invoice.deleteOne();
    res.json({ message: 'Invoice removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
