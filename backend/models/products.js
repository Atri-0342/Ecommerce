const { Schema, model, Types } = require("mongoose");

// --- 💬 REVIEW SCHEMA ---
const reviewSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// --- 🛍️ PRODUCT SCHEMA ---
const productSchema = new Schema(
  {
    product_name: { 
      type: String, 
      required: [true, "Name is required"], 
      trim: true 
    },
    dealerId: { 
      type: Types.ObjectId, 
      ref: "Dealer", 
      required: true 
    },
    price: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    discountPrice: { 
      type: Number, 
      default: 0 
    },
    description: { 
      type: String, 
      required: true, 
      trim: true 
    },
    stock: { 
      type: Number, 
      required: true, 
      min: 0 
    },
    images: [{ type: String }],
    
    // --- 🏷️ LINKED CATEGORY ---
    category: { 
      type: Types.ObjectId, 
      ref: "Category", // This links to your Category model
      required: [true, "Category is required"] 
    },
    rating: { type: Number, default: 0 }, 
    numReviews: { type: Number, default: 0 },
    clickCount: { type: Number, default: 0 },
    reviews: [reviewSchema], 
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = model("Product", productSchema);