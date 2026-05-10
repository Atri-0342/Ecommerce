const mongoose = require("mongoose");

const AIRecommendSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  preferredCategories: [String], // Array of Category Names
  preferredBrands: [String],     // Array of Brand Names
  keywords: [String],            // Extracted from product names
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AIRecommend", AIRecommendSchema);