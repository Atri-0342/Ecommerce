const { Schema, model } = require("mongoose");

const deliveryPersonSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    // --- 🏬 LOGISTICS CONNECTIONS ---
    assignedWarehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse", // Must match your Warehouse model name
      required: true,
    },
    status: {
      type: String,
      enum: ["Available", "On-Delivery", "Offline"],
      default: "Available",
    },
    // The current order they are handling
    currentOrder: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    // --- 📍 GEOLOCATION ---
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [Longitude, Latitude]
        default: [0, 0],
      },
    },
    // Performance tracking
    rating: {
      type: Number,
      default: 5,
    },
    totalDeliveries: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    socketId: {
  type: String,
  default: null,
},
  },
  { timestamps: true }
);

// Index for spatial queries (finding nearby delivery personnel)
deliveryPersonSchema.index({ location: "2dsphere" });

module.exports = model("DeliveryPerson", deliveryPersonSchema);