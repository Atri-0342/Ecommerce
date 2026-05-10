const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: String,
      enum: ["user", "bot", "assistant"],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    /**
     * Stores the AI-found products for this specific message.
     * This allows the frontend to re-render the Product Cards 
     * even after the user refreshes the page.
     */
    products: [
      {
        product_name: String,
        price: Number,
        brand: String,
        rating: Number,
        images: [String],
        _id: mongoose.Schema.Types.ObjectId,
      },
    ],
    // Optional: Useful if you want to group messages into separate chat sessions
    sessionId: {
      type: String,
      default: () => uuidv4(), // Generates a unique string like '1b9d6bcd-...'
    },
  },
  { timestamps: true }
);

// Indexing for faster history retrieval
messageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);