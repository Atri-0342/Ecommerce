const express = require("express");
const router = express.Router();
const { 
    createOrder, 
    getAllOrders, 
    getDealerOrders, 
    getOrdersByUser, 
    getOrder, 
    deleteOrder, 
    updateOrderStatus,
    shipToNearestWarehouse, // The logistics engine
    shipOrderAndAssignPartner, // Optional: if you need direct assignment
    updateDeliveryStatus, // Linked to verifyOTPAndCompleteDelivery
    submitFeedback,
    getMyActiveOrder
} = require("../controllers/orderController");

const { protect, adminOnly, dealerOnly } = require("../middleware/authMiddleware");

// --- 1. RIDER / DELIVERY SPECIFIC ROUTES ---
// Fetches active tasks for the delivery person dashboard
router.get("/my-tasks", protect, getMyActiveOrder);

// --- 2. SPECIALIZED / STATIC ROUTES ---
router.post("/create", createOrder);

// Fetch orders specifically for the logged-in Dealer's dashboard
router.get("/dealer-orders", protect, dealerOnly, getDealerOrders);

// Final step: Delivery person verifies the OTP at the doorstep
// This uses the updateDeliveryStatus logic
router.put("/verify-otp", protect, updateDeliveryStatus);

// Customer feedback after delivery
router.post("/feedback", protect, submitFeedback);


// --- 3. THE LOGISTICS ENGINE ---
/**
 * @desc Finds nearest warehouse, handles geocoding, and transfers inventory
 * Matches frontend: axios.put(`${API_URL}/orders/ship/${orderId}`)
 */
router.put("/ship/:orderId", protect, dealerOnly, shipToNearestWarehouse);

// If you use the combined shipping/partner assignment logic:
router.put("/dispatch/:orderId", protect, shipOrderAndAssignPartner);


// --- 4. STATUS UPDATES ---
// Used for transitions like "Ordered" -> "Packed" or "Cancelled"
router.put("/status/:id", protect, updateOrderStatus);


// --- 5. DATA RETRIEVAL ---
router.get("/all", protect, adminOnly, getAllOrders);
router.get("/user/:userId", protect, getOrdersByUser);


// --- 6. PARAMETERIZED ROUTES ---
// Keep these at the bottom to prevent route hijacking
router.get("/:id", protect, getOrder);
router.delete("/:id", protect, adminOnly, deleteOrder);

module.exports = router;