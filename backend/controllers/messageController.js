const Message = require("../models/message");
const mongoose = require("mongoose");

/**
 * 1. GET ALL SESSIONS (For Sidebar)
 * Groups messages by sessionId so the sidebar shows unique chats.
 */
exports.getChatSessions = async (req, res) => {
  try {
    const { userId } = req.params;

    const sessions = await Message.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $sort: { createdAt: 1 } }, // Sort oldest to newest first
      {
        $group: {
          _id: "$sessionId",
          // This picks the VERY FIRST message sent in this session as the title
          lastMessage: { $first: "$text" }, 
          // This keeps track of when the last message was sent for sorting the sidebar
          lastUpdate: { $last: "$createdAt" },
        },
      },
      { $sort: { lastUpdate: -1 } }, // Now put the most recently active chat at the top
      {
        $project: {
          _id: 0,
          sessionId: "$_id",
          lastMessage: 1,
          lastUpdate: 1,
        },
      },
    ]);

    res.status(200).json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch chat sessions" });
  }
};

/**
 * 2. GET SESSION HISTORY
 * Fetches only the messages belonging to one specific session.
 */
exports.getSessionHistory = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    const history = await Message.find({ userId, sessionId })
      .sort({ createdAt: 1 }) // Oldest to newest for natural chat flow
      .lean();

    res.status(200).json({ success: true, history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. DELETE A SPECIFIC SESSION
 * Triggered by the small trash icon on an individual session in the sidebar.
 */
exports.deleteSession = async (req, res) => {
  try {
    const { userId, sessionId } = req.params;

    const result = await Message.deleteMany({ userId, sessionId });

    res.status(200).json({ 
      success: true, 
      message: "Session deleted", 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting session" });
  }
};

/**
 * 4. CLEAR ALL HISTORY (Total Wipe)
 * Removes every single chat entry for this user.
 */
exports.clearAllHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.deleteMany({ userId });

    res.status(200).json({ 
      success: true, 
      message: "Total history wiped successfully" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to clear history" });
  }
};