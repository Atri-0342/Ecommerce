const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * @desc    Authenticate admin & get token
 * @route   POST /api/admins/login
 */
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ success: false, message: "Invalid Email or Password" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ success: false, message: "Account suspended. Contact SuperAdmin." });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid Email or Password" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.access_level },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    admin.lastLogin = Date.now();
    await admin.save();

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.full_name,
        email: admin.email,
        role: admin.access_level,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Get all admins (No exclusions)
 * @route   GET /api/admins
 * @access  Private (AdminOnly)
 */
exports.getAllAdmins = async (req, res) => {
  try {
    // This fetches EVERY admin regardless of role or current session
    const admins = await Admin.find().select("-password").sort("-createdAt");
    res.status(200).json({ success: true, count: admins.length, admins });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch admins" });
  }
};

/**
 * @desc    Create a new admin
 * @route   POST /api/admins/create
 * @access  Private (SuperAdminOnly)
 */
exports.createAdmin = async (req, res) => {
  try {
    const { full_name, email, password, access_level, phoneNumber } = req.body;

    const existing = await Admin.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await Admin.create({
      full_name,
      email,
      password: hashedPassword,
      access_level,
      phoneNumber,
    });

    const adminData = newAdmin.toObject();
    delete adminData.password;

    res.status(201).json({ success: true, admin: adminData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Update admin details (With optional password change)
 * @route   PUT /api/admins/update/:id
 * @access  Private (SuperAdminOnly)
 */
exports.updateAdmin = async (req, res) => {
  try {
    const { full_name, email, access_level, phoneNumber, isActive, password } = req.body;

    // Find the admin first
    let admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    // Update basic fields
    admin.full_name = full_name || admin.full_name;
    admin.email = email || admin.email;
    admin.access_level = access_level || admin.access_level;
    admin.phoneNumber = phoneNumber || admin.phoneNumber;
    
    // Prevent self-suspension to avoid dashboard lockouts
    if (req.user.id !== req.params.id) {
        admin.isActive = typeof isActive !== 'undefined' ? isActive : admin.isActive;
    }

    // If a new password is provided, hash it
    if (password && password.trim() !== "") {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(password, salt);
    }

    await admin.save();

    // Return updated admin without password
    const updatedAdmin = admin.toObject();
    delete updatedAdmin.password;

    res.status(200).json({ success: true, admin: updatedAdmin });
  } catch (err) {
    res.status(500).json({ success: false, message: "Update failed: " + err.message });
  }
};

/**
 * @desc    Delete an admin
 * @route   DELETE /api/admins/delete/:id
 * @access  Private (SuperAdminOnly)
 */
exports.deleteAdmin = async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.user.id === req.params.id) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.status(200).json({ success: true, message: "Admin deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed" });
  }
};

/**
 * @desc    Toggle admin active status
 * @route   PATCH /api/admins/toggle-status/:id
 * @access  Private (SuperAdminOnly)
 */
exports.toggleAdminStatus = async (req, res) => {
  try {
    // Safety: prevent self-disabling
    if (req.user.id === req.params.id) {
        return res.status(400).json({ success: false, message: "You cannot suspend your own account" });
    }

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.status(200).json({ success: true, isActive: admin.isActive });
  } catch (err) {
    res.status(500).json({ success: false, message: "Status toggle failed" });
  }
};