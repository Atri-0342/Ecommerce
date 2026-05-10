const mongoose = require("mongoose");

const AIPreferenceSchema = new mongoose.Schema({
  // Link to the specific user
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    unique: true 
  },

  // Stores unique categories the user interacts with (from Chat, Orders, or Clicks)
  interestedCategories: [{ type: String }],

  // Stores unique brands the user prefers
  preferredBrands: [{ type: String }],

  // Stores a history of their AI searches/sentences
  recentQueries: [
    {
      query: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ],

  // Tracks the last product they interacted with to show in the AI modal
  lastViewedProductId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Product" 
  },

  // Meta-data for tracking when the "User Interest Profile" was last changed
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Middleware to automatically update the 'updatedAt' field whenever the document is saved
AIPreferenceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Using the name AIPreference as discussed
module.exports = mongoose.model("AIPreference", AIPreferenceSchema);