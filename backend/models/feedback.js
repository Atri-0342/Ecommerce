const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    // No ref here allows it to be an ID from any collection
  },
  name: {
    type: String, // Store the name directly so Admin knows who it is without a complex join
    required: true
  },
  email: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'pending' // pending, seen, resolved
  },
  admin_reply: {
    type: String,
    default: ""
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);