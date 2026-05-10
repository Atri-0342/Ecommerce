const nodemailer = require("nodemailer");

const sendStatusEmail = async (email, orderId, status, userName) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Your 16-character App Password
    },
  });

  const mailOptions = {
    from: '"MyShop Support" <paulpinaki45@gmail.com>',
    to: email,
    subject: `Your Order #${orderId.slice(-6).toUpperCase()} is ${status}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
        <h2 style="color: #0d6efd;">Order Update</h2>
        <p>Hi <strong>${userName}</strong>,</p>
        <p>The status of your order has been updated to: <strong style="color: #28a745;">${status}</strong></p>
        <p>Thank you for shopping with MyShop!</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = sendStatusEmail;