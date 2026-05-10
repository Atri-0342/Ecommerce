const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"],
  },
  phone: {
    type: String,
    required: [true, "Phone is required"],
    trim: true,
    unique: true,
    match: [/^\+?[0-9]{7,15}$/, "Please provide a valid phone number"],
  },
  address: {
    type: String,
    required: [true, "Address is required"],
    trim: true,
  },
  image: {
    type: String, // Stores the URL or file path
    default: ""
  },
  password: {
    type: String,
    required: true,
    trim: true,
  },
    // 🔐 ADD THESE FOR 2FA
  otp: {
    type: Number
  },
  otpExpire: {
    type: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  }
});
module.exports = model("User", userSchema);