const Feedback = require('../models/Feedback');
const nodemailer = require('nodemailer');

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * @desc    Send a message/feedback to the Admin
 * @route   POST /api/feedback/send
 * @access  Private (User or Dealer)
 */
exports.sendFeedbackToAdmin = async (req, res) => {
  try {
    const { subject, message } = req.body;
    const sender = req.user; 

    // 1. Safety Check: Ensure the sender object exists
    if (!sender) {
      return res.status(401).json({ success: false, message: "User context missing" });
    }

    // 2. Debug Log: See what is actually reaching the server
    console.log("Attempting to save feedback from:", sender.email);

    const feedbackEntry = new Feedback({
      sender_id: sender._id,
      name: sender.name || "Unknown Dealer",
      email: sender.email || "no-email@provided.com", // Fallback for required field
      subject: subject && subject.trim() !== "" ? subject : "Support Inquiry", 
      message: message
    });

    await feedbackEntry.save();

    res.status(201).json({
      success: true,
      message: "Message sent to Admin successfully!",
      data: feedbackEntry
    });
  } catch (error) {
    // 3. Log the specific Mongoose error to your terminal
    console.error("FEEDBACK_SAVE_ERROR:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get history of messages sent by the logged-in entity
 * @route   GET /feedbacks/my-messages
 * @access  Private
 */
exports.getMyFeedbackHistory = async (req, res) => {
  try {
    const messages = await Feedback.find({ sender_id: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Admin: Get all feedbacks
 * @route   GET /feedback/all
 * @access  Private (Admin Only)
 */
exports.getAllFeedbacksForAdmin = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, feedbacks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Admin replies to feedback & sends email
 * @route   PUT /api/feedback/admin-reply/:id
 * @access  Private (Admin Only)
 */
exports.adminReplyToFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const feedback = await Feedback.findByIdAndUpdate(
      id,
      { admin_reply: reply, status: 'resolved' },
      { new: true }
    );

    if (!feedback) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Email Notification logic
    const mailOptions = {
      from: `"YuKTI Admin" <${process.env.EMAIL_USER}>`,
      to: feedback.email,
      subject: `Update on your Inquiry: ${feedback.subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
          <h2 style="color: #0d6efd;">Hi ${feedback.name},</h2>
          <p>Admin has responded to your message:</p>
          <blockquote style="background: #f8f9fa; padding: 15px; border-left: 5px solid #0d6efd;">
            ${reply}
          </blockquote>
          <p>Check your dashboard for more details.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, message: "Reply sent and dealer notified.", data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};