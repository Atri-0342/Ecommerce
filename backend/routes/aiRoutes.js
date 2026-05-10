const express = require("express");
const router = express.Router();

// Import the controllers we built
const { processAIQuery, getAISuggestions } = require("../controllers/aiController");

// Import your protect middleware
const { protect } = require("../middleware/authMiddleware");

/**
 * @route   POST /ai/query
 * @desc    Process natural language product search
 * @access  Protected (Any logged-in user: Admin, Dealer, User, Delivery)
 */
router.post("/query", protect, processAIQuery);

/**
 * @route   GET /ai/suggestions/:userId
 * @desc    Get personalized product recommendations for the AI Modal
 * @access  Protected
 */
router.get("/suggestions/:userId", protect, getAISuggestions);

module.exports = router;