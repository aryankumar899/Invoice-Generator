import Client from '../models/Client.js';

// @desc    Get all clients for a user
// @route   GET /api/clients
// @access  Private
export const getClients = async (req, res) => {
  try {
    const clients = await Client.find({ user: req.user._id });
    res.json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a client
// @route   POST /api/clients
// @access  Private
export const createClient = async (req, res) => {
  try {
    const { name, email, address, phone } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Client name is required' });
    }

    if (email) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
      }
    }

    const client = new Client({
      user: req.user._id,
      name,
      email,
      address,
      phone
    });

    const createdClient = await client.save();
    res.status(201).json(createdClient);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a client
// @route   PUT /api/clients/:id
// @access  Private
export const updateClient = async (req, res) => {
  try {
    const { name, email, address, phone } = req.body;

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check user
    if (client.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    if (email) {
      const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Please provide a valid email address.' });
      }
    }

    client.name = name || client.name;
    client.email = email || client.email;
    client.address = address || client.address;
    client.phone = phone || client.phone;

    const updatedClient = await client.save();
    res.json(updatedClient);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a client
// @route   DELETE /api/clients/:id
// @access  Private
export const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check user
    if (client.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await client.deleteOne();
    res.json({ message: 'Client removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
