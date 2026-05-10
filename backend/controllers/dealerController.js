const Dealer = require("../models/dealer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");

// ==========================================
// 1. ADMIN: Fetch All Dealers
// ==========================================
exports.getAllDealers = async (req, res) => {
  try {
    const dealers = await Dealer.find().sort({ createdAt: -1 });
    res.status(200).json({ 
      success: true, 
      count: dealers.length, 
      dealers 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Error fetching dealers", 
      error: err.message 
    });
  }
};

// ==========================================
// 2. PUBLIC: Apply to be a Dealer (UPDATED PATH)
// ==========================================
exports.applyAsDealer = async (req, res) => {
  try {
    const { 
      brandName, 
      panNumber, 
      aadharNumber, 
      description, 
      ownerName, 
      email, 
      phone 
    } = req.body;

    const existingDealer = await Dealer.findOne({ email: email.toLowerCase() });
    if (existingDealer) {
      return res.status(400).json({ 
        success: false,
        message: "An application or account with this email already exists." 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: "Please upload your identity proof (PDF or Image)." 
      });
    }

    // UPDATED: Changed path from 'uploads/proofs/' to just 'uploads/'
    // This matches your app.use("/uploads", express.static("uploads")) middleware
    const newDealer = await Dealer.create({
      ownerName,
      email: email.toLowerCase(),
      brandName, 
      phone,
      panNumber,
      aadharNumber,
      description,
      proofAttachment: `uploads/${req.file.filename}`, 
      status: "pending",
      isApproved: false
    });

    res.status(201).json({
      success: true,
      message: "Application submitted! Our team will review it shortly.",
      dealer: newDealer
    });
  } catch (err) {
    console.error("🔴 Dealer Application Error:", err);
    res.status(500).json({ 
      success: false,
      message: "Server error during application: " + err.message 
    });
  }
};

// ==========================================
// 3. PUBLIC: Dealer Login
// ==========================================
exports.dealerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const dealer = await Dealer.findOne({ email: email.toLowerCase().trim() });
    if (!dealer) return res.status(404).json({ success: false, message: "Dealer not found." });

    if (!dealer.isApproved) {
      return res.status(403).json({ 
        success: false, 
        message: "Account pending approval." 
      });
    }

    const isMatched = await bcrypt.compare(password, dealer.password);
    if (!isMatched) return res.status(400).json({ success: false, message: "Invalid credentials." });

    const accessToken = generateAccessToken(dealer); 
    const refreshToken = generateRefreshToken(dealer);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", 
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    dealer.lastLogin = Date.now();
    await dealer.save();

    res.json({
      success: true,
      message: "Dealer Login successful",
      accessToken, 
      dealer: {
        id: dealer._id,
        name: dealer.ownerName,
        brand: dealer.brandName,
        email: dealer.email,
        status: dealer.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login Error: " + err.message });
  }
};

// ==========================================
// 4. ADMIN: Approve Dealer & Email Credentials
// ==========================================
exports.approveDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const dealer = await Dealer.findById(id);

    if (!dealer) return res.status(404).json({ message: "Application not found" });
    if (dealer.status === "approved") return res.status(400).json({ message: "Dealer already approved." });

    const rawPassword = crypto.randomBytes(4).toString("hex"); 
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(rawPassword, salt);

    dealer.password = hashedPassword;
    dealer.isApproved = true;
    dealer.status = "approved";
    await dealer.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"YuKTI Admin" <${process.env.EMAIL_USER}>`,
      to: dealer.email,
      subject: "Welcome to YuKTI - Merchant Application Approved!",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">Welcome to the Merchant Network!</h2>
          <p>Hello <b>${dealer.ownerName}</b>,</p>
          <p>Your application for <b>${dealer.brandName}</b> has been approved.</p>
          <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><b>Login Email:</b> ${dealer.email}</p>
            <p style="margin: 10px 0 0 0;"><b>Temporary Password:</b> <span style="color: #4f46e5; font-weight: bold;">${rawPassword}</span></p>
          </div>
          <p>Please change your password immediately after logging in for security.</p>
          <p>Best Regards,<br/>YuKTI Admin Team</p>
        </div>
      `
    });

    res.status(200).json({ success: true, message: "Dealer approved and credentials emailed." });
  } catch (err) {
    console.error("Approval Error:", err);
    res.status(500).json({ success: false, message: "Approval failed: " + err.message });
  }
};

// ==========================================
// 5. ADMIN: Reject/Revoke Dealer
// ==========================================
exports.rejectDealer = async (req, res) => {
  try {
    const { id } = req.params;
    const dealer = await Dealer.findByIdAndUpdate(
      id, 
      { status: "rejected", isApproved: false }, 
      { new: true }
    );

    if (!dealer) return res.status(404).json({ success: false, message: "Dealer not found" });

    res.status(200).json({ success: true, message: "Dealer application rejected." });
  } catch (err) {
    res.status(500).json({ success: false, message: "Rejection failed: " + err.message });
  }
};

// ==========================================
// 6. UTILITY: Get Application Status
// ==========================================
exports.getDealerStatus = async (req, res) => {
  try {
    const { email } = req.params;
    const dealer = await Dealer.findOne({ email: email.toLowerCase() }).select("status createdAt brandName");
    
    if (!dealer) {
      return res.status(404).json({ success: false, message: "No application found for this email." });
    }
    
    res.json({
      success: true,
      status: dealer.status,
      appliedAt: dealer.createdAt,
      brandName: dealer.brandName
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==========================================
// 7. PASSWORD RECOVERY: Request OTP
// ==========================================
exports.dealerForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const dealer = await Dealer.findOne({ email: email.toLowerCase() });
    
    if (!dealer) return res.status(404).json({ message: "Dealer not found." });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    dealer.resetPasswordToken = otp; 
    dealer.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 mins
    await dealer.save();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `"YuKTI Security" <${process.env.EMAIL_USER}>`,
      to: dealer.email,
      subject: "Verification Code: Password Reset",
      html: `
        <div style="font-family: sans-serif; text-align: center; padding: 20px;">
          <h2 style="color: #6366f1;">Password Reset OTP</h2>
          <p>Use the code below to reset your merchant account password.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 12px; display: inline-block; margin: 20px 0;">
            <h1 style="letter-spacing: 10px; margin: 0;">${otp}</h1>
          </div>
          <p style="font-size: 12px; color: #666;">Valid for 10 minutes.</p>
        </div>
      `
    });

    res.json({ success: true, message: "OTP sent to your registered email." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==========================================
// 8. PASSWORD RECOVERY: Update Password
// ==========================================
exports.dealerResetPassword = async (req, res) => {
  try {
    const { otp, email, password } = req.body;

    if (!otp || !email || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const dealer = await Dealer.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: String(otp),
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!dealer) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP." });
    }

    const salt = await bcrypt.genSalt(10);
    dealer.password = await bcrypt.hash(password, salt);
    
    dealer.resetPasswordToken = undefined;
    dealer.resetPasswordExpires = undefined;
    
    await dealer.save();

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Reset Error: " + err.message });
  }
};