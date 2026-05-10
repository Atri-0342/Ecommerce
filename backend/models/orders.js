const { Schema, model } = require("mongoose");

const orderSchema = new Schema(
  {
    // --- 👤 CUSTOMER INFO ---
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true
    },

    // --- 🛒 ORDER CONTENT ---
    items: [
      {
        product: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        product_name: { 
          type: String 
        },
        price: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          default: 1
        }
      }
    ],
    total: {
      type: Number,
      required: true
    },

    // --- 📍 SHIPPING & PAYMENT ---
    shipAddress: {
      type: String,
      required: true
    },
    payment: {
      type: String,
      enum: ["pending", "paid", "cod"],
      default: "pending"
    },
    status: {
      type: String,
      enum: ["Ordered", "Packed", "Shipped", "Delivered", "Cancelled"],
      default: "Ordered"
    },

    // --- 🚚 LOGISTICS & DELIVERY UPDATES ---
    assignedWarehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      default: null
    },
    deliveryPartner: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryPerson", // Refers to the rider/delivery staff
      default: null
    },
    deliveryOTP: {
      type: String,
      default: null // Generated when status changes to 'Shipped'
    },

    // --- 💬 CHAT & FEEDBACK ---
    // Inside your Order Schema
chatActive: {
    type: Boolean,
    default: true // Allows chat by default when order is created
},
    reviewed: {
      type: Boolean,
      default: false
    },
    cancelReason: {
      type: String,
      default: null
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// ================== HELPER METHODS ==================

/**
 * Check if the user and delivery partner can currently chat.
 * Used in Socket.io and API middleware.
 */
orderSchema.methods.isChatAllowed = function() {
  return this.status === "Shipped" && this.chatActive === true;
};

/**
 * Virtual property to get a clean short ID for the UI
 * Example: #6F2A
 */
orderSchema.virtual('shortId').get(function() {
  return this._id.toString().slice(-4).toUpperCase();
});

// ================== INDEXING ==================

// Optimize queries for the Delivery App dashboard
orderSchema.index({ deliveryPartner: 1, status: 1 });
// Optimize queries for User order history
orderSchema.index({ user: 1, createdAt: -1 });

module.exports = model("Order", orderSchema);