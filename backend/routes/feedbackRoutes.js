const express = require('express');
const router = express.Router();

// Import middleware
const { protect, adminOnly } = require('../middleware/authMiddleware');

const { 
  sendFeedbackToAdmin, 
  getMyFeedbackHistory, 
  getAllFeedbacksForAdmin, 
  adminReplyToFeedback 
} = require('../controllers/feedbackController');

// --- SHARED ROUTES (Open to anyone with a valid Token) ---

/**
 * @route   POST /feedbacks/send
 * @desc    Send a message to Admin (Used by both Dealers and Users)
 * @access  Private (Any logged-in account)
 */
router.post('/send', protect, sendFeedbackToAdmin);

/**
 * @route   GET /api/feedbacks/my-messages
 * @desc    View personal inquiry history
 * @access  Private (Any logged-in account)
 */
router.get('/my-messages', protect, getMyFeedbackHistory);


// --- ADMIN ONLY ROUTES ---

// --- ADMIN ONLY ROUTES ---

// Fix: Removed /api from the path string here
router.get('/all', protect, adminOnly, getAllFeedbacksForAdmin);

// Fix: Removed /api from the path string here
router.put('/admin-reply/:id', protect, adminOnly, adminReplyToFeedback);

module.exports = router;