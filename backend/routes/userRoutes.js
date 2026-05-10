const express = require("express");
const router = express.Router();
const {
  register,
  verifyRegisterOtp,
  login,
  verifyLoginOtp,
  resendOtp,
  getAllUsers,
  refresh,
  forgotPassword,
  resetPassword,
  logout,
  logoutAllDevices,
  updateProfile,
  getSessions,
  deleteAccount,
  changePasswordOtp
} = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

// --- 🔑 Authentication & Session ---
router.post("/refresh", refresh);

// --- 📝 Registration ---
router.post("/register", register);
router.post("/verify-register-otp", verifyRegisterOtp);

// --- 🔓 Login & OTP ---
router.post("/login", login);
router.post("/verify-login-otp", verifyLoginOtp);
router.post("/resend-otp", resendOtp);

// --- 🚪 Logout ---
router.post("/logout", protect, logout);
router.post("/logout-all", protect, logoutAllDevices);

// --- 🛠️ Password Recovery & Security ---
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
// Inside userRoutes.js
router.put("/change-password-otp", protect, changePasswordOtp);
// --- 👤 User Data & Profile ---
router.get("/", getAllUsers); 
router.get("/sessions", protect, getSessions); // Added for SecuritySettings.js

router.put("/profile", protect, updateProfile);

// --- 🗑️ Account Management ---
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;