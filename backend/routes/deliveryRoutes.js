const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");

// 1. Auth & Profile
const { 
    registerDeliveryPerson, 
    loginDeliveryPerson,
    logoutDeliveryPerson,
    getDeliveryProfile,
    toggleDutyStatus 
} = require("../controllers/deliveryAuthController");

// 2. Logistics & Task Logic
const { 
    updateRiderLocation, 
    getMyActiveOrder,
    updateDeliveryStatus 
} = require("../controllers/deliveryController");

// 3. Orders & Admin Actions
const { shipOrderAndAssignPartner, submitFeedback } = require("../controllers/orderController");

// 4. Chat System
const { 
    deliverySendMessage,       
    userSendMessage,           
    getDeliveryChatHistory 
} = require("../controllers/deliveryMessageController");

// --- ENDPOINTS ---

// Auth
router.post("/register", registerDeliveryPerson);
router.post("/login", loginDeliveryPerson);
router.get("/profile", protect, getDeliveryProfile);
router.post("/logout", protect, logoutDeliveryPerson);
router.put("/toggle-duty", protect, toggleDutyStatus);

// Tracking & Tasks
router.patch("/update-location", protect, updateRiderLocation);
router.get("/my-tasks", protect, getMyActiveOrder);
router.put("/ship/:orderId", protect, shipOrderAndAssignPartner);
router.put("/update-status", protect, updateDeliveryStatus);

// Chat & Feedback
router.post("/send-message1", protect, deliverySendMessage);
router.post("/send-message2", protect, userSendMessage);
router.get("/chat-history/:orderId", protect, getDeliveryChatHistory);
router.post("/feedback", protect, submitFeedback);

module.exports = router;