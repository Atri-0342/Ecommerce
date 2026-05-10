const express = require("express");
const router = express.Router();
const { 
    loginAdmin,
    getAllAdmins, 
    createAdmin, 
    updateAdmin, 
    deleteAdmin, 
    toggleAdminStatus 
} = require("../controllers/adminController");

const { protect, adminOnly, superAdminOnly } = require("../middleware/authMiddleware");

// --- PUBLIC ROUTES ---
router.post("/login", loginAdmin);

/** * NOTE: For initial setup, we leave 'create' public. 
 * Switch this to [protect, superAdminOnly] after creating your first admin!
 */
router.post("/create", createAdmin); 

// --- PROTECTED ROUTES ---
router.get("/", protect, adminOnly, getAllAdmins);

// --- SUPERADMIN ONLY ROUTES ---
router.put("/update/:id", protect, superAdminOnly, updateAdmin);
router.delete("/delete/:id", protect, superAdminOnly, deleteAdmin);
router.patch("/toggle-status/:id", protect, superAdminOnly, toggleAdminStatus);

module.exports = router;