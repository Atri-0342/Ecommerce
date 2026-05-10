const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");

/**
 * @route   GET /api/messages/sessions/:userId
 * @desc    Get all unique chat sessions for the sidebar preview
 */
router.get("/sessions/:userId", messageController.getChatSessions);

/**
 * @route   GET /api/messages/history/:userId/:sessionId
 * @desc    Get all messages for a specific chat session
 */
router.get("/history/:userId/:sessionId", messageController.getSessionHistory);

/**
 * @route   DELETE /api/messages/session/:userId/:sessionId
 * @desc    Delete one specific chat session (one row in the sidebar)
 */
router.delete("/session/:userId/:sessionId", messageController.deleteSession);

/**
 * @route   DELETE /api/messages/clear/:userId
 * @desc    Wipe all chat history for the user
 */
router.delete("/clear/:userId", messageController.clearAllHistory);

module.exports = router;