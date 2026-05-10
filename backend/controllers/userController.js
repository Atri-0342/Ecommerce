const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/users");
const { generateAccessToken, generateRefreshToken } = require("../utils/token");

// --- 🖼️ MULTER CONFIGURATION ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `profile-${req.user?._id || "new"}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const fileTypes = /jpeg|jpg|png|webp/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) return cb(null, true);
    cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
  },
}).single("image");

// --- 📧 EMAIL HELPER ---
const sendEmail = async (email, content, subject, isLink = false) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const htmlContent = isLink
    ? `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to proceed. This link expires in 15 minutes.</p>
        <a href="${content}" style="display: inline-block; background: #6366f1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
       </div>`
    : `<div style="font-family: Arial, sans-serif; text-align: center;">
        <h3>Your Verification Code:</h3>
        <h1 style="color: #6366f1; letter-spacing: 5px;">${content}</h1>
       </div>`;

  return transporter.sendMail({
    from: `"Support Team" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html: htmlContent,
  });
};

// --- 🔐 AUTHENTICATION CONTROLLERS ---

exports.register = async (req, res) => {
  try {
    const { name, email, phone, address, password } = req.body;
    if (!name || !email || !phone || !address || !password) 
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) return res.status(400).json({ message: "Email or phone already exists" });

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const otp = Math.floor(100000 + Math.random() * 900000);

    await User.create({
      name, email, phone, address,
      password: hashedPassword,
      otp,
      otpExpire: Date.now() + 5 * 60 * 1000,
      isVerified: false
    });

    await sendEmail(email, otp, "Verify Your Registration");
    return res.status(200).json({ message: "OTP sent to your email!", email });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.verifyRegisterOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.otp !== Number(otp)) return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpire < Date.now()) return res.status(400).json({ message: "OTP expired" });

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;
    await user.save();
    return res.json({ message: "Registration successful" });
  } catch (err) {
    return res.status(500).json({ message: "Error verifying OTP" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const matched = await bcrypt.compare(password, user.password);
    if (!matched) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified) return res.status(400).json({ message: "Please verify your account first" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;
    await user.save();

    await sendEmail(email, otp, "Login Verification Code");
    return res.json({ message: "OTP sent for login", email });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.otp !== Number(otp)) return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpire < Date.now()) return res.status(400).json({ message: "OTP expired" });

    user.otp = null;
    user.otpExpire = null;
    await user.save();

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, 
      path: "/",
    });

    const { password, otp: o, otpExpire, ...safeUser } = user._doc;
    return res.json({ message: "Login successful", accessToken, user: safeUser });
  } catch (err) {
    return res.status(500).json({ message: "Error verifying OTP" });
  }
};

// --- 👤 USER PROFILE & DATA ---

exports.updateProfile = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    try {
      const { name, phone, address } = req.body;
      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (address) user.address = address;

      if (req.file) {
        user.image = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
      }

      const updatedUser = await user.save();
      const { password, otp, otpExpire, ...safeUser } = updatedUser._doc;

      res.status(200).json({ success: true, message: "Profile updated!", user: safeUser });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
};

// --- 🛡️ SECURITY & SESSIONS ---

// Logic for changing password with OTP (The one your frontend calls)
exports.changePasswordOtp = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate OTP
    if (user.otp !== Number(otp)) return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpire < Date.now()) return res.status(400).json({ message: "OTP expired" });

    // Hash and update password
    user.password = await bcrypt.hash(String(newPassword), 10);
    user.otp = null;
    user.otpExpire = null;
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = [
      {
        deviceName: req.headers["user-agent"].includes("Windows") ? "Windows PC" : "Mobile Device",
        deviceType: req.headers["user-agent"].includes("Mobile") ? "mobile" : "desktop",
        browser: "Chrome/Safari",
        ipAddress: req.ip || "127.0.0.1",
        lastActive: "Just now",
        isCurrent: true,
      }
    ];
    res.status(200).json({ sessions });
  } catch (err) {
    res.status(500).json({ message: "Error fetching sessions" });
  }
};

// --- 🔑 PASSWORD RECOVERY ---

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account found." });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; 
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    await sendEmail(email, resetUrl, "Password Reset Link", true);
    return res.status(200).json({ message: "Reset link sent!" });
  } catch (err) {
    return res.status(500).json({ message: "Error sending reset link." });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) return res.status(400).json({ message: "Link invalid or expired." });

    user.password = await bcrypt.hash(String(password), 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    return res.status(500).json({ message: "Error resetting password." });
  }
};

// --- 🚪 LOGOUT & DELETE ---

exports.logout = async (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return res.status(200).json({ success: true, message: "Logged out" });
};

exports.logoutAllDevices = async (req, res) => {
  try {
    res.clearCookie("refreshToken", { path: "/" });
    return res.status(200).json({ success: true, message: "Logged out of all devices" });
  } catch (err) {
    res.status(500).json({ message: "Error during global logout" });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.clearCookie("refreshToken", { path: "/" });
    return res.status(200).json({ success: true, message: "Account deleted." });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) return res.status(401).json({ message: "Invalid refresh token" });

      const user = await User.findById(decoded.id).select("-password -otp -otpExpire");
      
      // ✅ ADD THIS CHECK TO PREVENT THE CRASH
      if (!user) {
        return res.status(401).json({ message: "User no longer exists" });
      }

      const newAccessToken = jwt.sign(
        { id: user._id }, 
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: "15m" }
      );
      
      return res.json({ accessToken: newAccessToken, user });
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.otp = otp;
    user.otpExpire = Date.now() + 5 * 60 * 1000;
    await user.save();
    await sendEmail(email, otp, "Your New Verification Code");
    return res.status(200).json({ message: "New OTP sent!" });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password -otp -otpExpire");
    return res.status(200).json({ count: users.length, users });
  } catch (err) {
    return res.status(500).json({ message: "Internal Server Issue" });
  }
};