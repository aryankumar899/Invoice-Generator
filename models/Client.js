import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  address: {
    type: String,
  },
  phone: {
    type: String,
  },
}, { timestamps: true });

const Client = mongoose.model('Client', clientSchema);

export default Client;
