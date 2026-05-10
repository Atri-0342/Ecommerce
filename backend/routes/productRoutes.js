const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload"); 
const { protect, dealerOnly, adminOrDealer } = require("../middleware/authMiddleware");
const aiController = require("../controllers/aiController");
const {
  createProduct,
  getAllProducts,
  getDealerProducts,
  getProduct,
  getProductsByCategory,
  getAIRecommendations,
  updateProduct,
  deleteProduct,
  trackClick,
  createReview,
} = require("../controllers/productController");

// --- 🖼️ MULTER ERROR HANDLER WRAPPER ---
const uploadMiddleware = (req, res, next) => {
  upload.array("images", 5)(req, res, function (err) {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ==========================================
// 1. PUBLIC ROUTES
// ==========================================
router.get("/", getAllProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get("/detail/:id", getProduct);
router.get("/ai-recommend/:id", getAIRecommendations);
router.patch("/click/:id", trackClick);

// ==========================================
// 2. AUTHENTICATED USER ROUTES
// ==========================================
router.post("/:id/reviews", protect, createReview);

// ==========================================
// 3. DEALER & ADMIN ROUTES
// ==========================================

// Only dealers can see their own dashboard list
router.get("/dealer/my-products", protect, dealerOnly, getDealerProducts);

// Only dealers can create products (to ensure dealerId is assigned)
router.post("/create", protect, dealerOnly, uploadMiddleware, createProduct);

// BOTH Admins and Dealers can update details
router.put("/update/:id", protect, adminOrDealer, uploadMiddleware, updateProduct);

// BOTH Admins and Dealers can delete products
router.delete("/delete/:id", protect, adminOrDealer, deleteProduct);

router.get("/suggested/:userId", aiController.getSuggestedProducts);

module.exports = router;