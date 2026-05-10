const { Schema, model, models } = require("mongoose");

const adminSchema = new Schema(
  {
    full_name: {
      type: String,
      required: [true, "Admin name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Admin email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    // Define levels: e.g., 'Super' can delete everything, 'Editor' can only edit products
    access_level: {
      type: String,
      enum: ["SuperAdmin", "Moderator", "Editor"],
      default: "Moderator",
    },
    profile_image: {
      type: String,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// --- THE FIX FOR RE-RENDERING ---
const Admin = models.Admin || model("Admin", adminSchema);

module.exports = Admin;