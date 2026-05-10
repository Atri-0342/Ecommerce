const nodemailer = require("nodemailer");

/**
 * @param {Object} options 
 * @param {string} options.email - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.message - Plain text message (fallback)
 * @param {string} options.html - HTML content (for buttons/links/formatting)
 */
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message, // Fallback for email clients that don't render HTML
    html: options.html,    // ✅ Added HTML support
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Nodemailer Error:", error);
    throw new Error("Email could not be sent");
  }
};

module.exports = sendEmail;