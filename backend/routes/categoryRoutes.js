const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const upload = require("../middleware/upload");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// FIX: Allow BOTH Admins and Dealers to view categories so they can fill dropdowns
router.get("/", protect, categoryController.getAllCategories);

// KEEP: Admin Only for modifications
router.post("/create", protect, adminOnly, upload.single("image"), categoryController.createCategory);
router.put("/update/:id", protect, adminOnly, upload.single("image"), categoryController.updateCategory);
router.delete("/delete/:id", protect, adminOnly, categoryController.deleteCategory);

module.exports = router;