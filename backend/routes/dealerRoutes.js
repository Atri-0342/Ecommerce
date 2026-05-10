const express = require("express");
const router = express.Router();
const { 
    applyAsDealer, 
    approveDealer, 
    rejectDealer, // Import the new reject function
    getDealerStatus,
    dealerLogin,
    dealerForgotPassword,
    dealerResetPassword,
    getAllDealers
} = require("../controllers/dealerController");

const upload = require("../middleware/upload");

// ==========================================
// 1. GUEST / APPLICANT ROUTES
// ==========================================

// Application submission (Handles file upload for identity proof)
router.post("/apply", upload.single("proof"), applyAsDealer);

// Status check (Publicly accessible by email)
router.get("/status/:email", getDealerStatus);

// ==========================================
// 2. DEALER AUTHENTICATION & RECOVERY
// ==========================================

// Login
router.post("/login", dealerLogin);

// Forgot Password - Step 1: Request OTP
router.post("/forgot-password", dealerForgotPassword);

// Reset Password - Step 2: Update password using OTP
router.put("/reset-password", dealerResetPassword);

// ==========================================
// 3. ADMIN ONLY ROUTES
// ==========================================

/** * Note: You should ideally wrap these in your adminAuth middleware 
 * e.g., router.get("/all", adminProtect, getAllDealers);
 */

// Get all applications for the admin dashboard
router.get("/all", getAllDealers); 

// Approve a dealer application (Generates credentials and emails them)
router.put("/approve/:id", approveDealer);

// Reject or Revoke a dealer application
router.put("/reject/:id", rejectDealer); 

module.exports = router;