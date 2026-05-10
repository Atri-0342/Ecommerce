const mongoose = require("mongoose");

const dealerSchema = new mongoose.Schema({
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  brandName: { type: String, required: true },
  phone: { type: String },
  panNumber: { type: String, required: true },
  aadharNumber: { type: String, required: true },
  description: { type: String },
  proofAttachment: { type: String }, 
  status: { type: String, default: "pending" },
  isApproved: { type: Boolean, default: false },
  password: { type: String },
  
  // --- NEW FIELDS FOR PASSWORD RESET ---
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  // -------------------------------------
  
  lastLogin: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Dealer", dealerSchema);