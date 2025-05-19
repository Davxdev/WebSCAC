import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  message: { type: String, required: true },
  status: { type: String, default: 'pending' },
  recipients: { type: String, required: true }, 
  fileUrl: { type: String },
});

export const MessageModel = mongoose.model('Message', messageSchema);
