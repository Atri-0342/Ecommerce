const DeliveryPerson = require("../models/DeliveryPerson");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================== REGISTER ==================
exports.registerDeliveryPerson = async (req, res) => {
  try {
    const { name, email, phone, password, assignedWarehouse } = req.body;

    const existingPerson = await DeliveryPerson.findOne({ $or: [{ email }, { phone }] });
    if (existingPerson) {
      return res.status(400).json({ message: "Delivery person already registered with this email/phone." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newPerson = await DeliveryPerson.create({
      name,
      email,
      phone,
      password: hashedPassword,
      assignedWarehouse, 
    });

    const personData = newPerson.toObject();
    delete personData.password;

    res.status(201).json({ success: true, message: "Registration successful!", data: personData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ================== LOGIN ==================
exports.loginDeliveryPerson = async (req, res) => {
  try {
    const { email, password } = req.body;

    const person = await DeliveryPerson.findOne({ email });
    if (!person) return res.status(404).json({ message: "Rider account not found." });

    const isMatch = await bcrypt.compare(password, person.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials." });

    const token = jwt.sign(
      { id: person._id, role: "delivery" },
      process.env.ACCESS_TOKEN_SECRET, 
      { expiresIn: "1d" }
    );

    res.cookie("deliveryToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      token, 
      person: {
        id: person._id,
        name: person.name,
        email: person.email,
        phone: person.phone,
        status: person.status,
        warehouse: person.assignedWarehouse
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================== LOGOUT ==================
exports.logoutDeliveryPerson = async (req, res) => {
  // Changed to match "deliveryToken" used in Login
  res.clearCookie("deliveryToken");
  res.status(200).json({ success: true, message: "Logged out successfully." });
};

// ================== GET PROFILE ==================
exports.getDeliveryProfile = async (req, res) => {
  try {
    const person = await DeliveryPerson.findById(req.user.id).select("-password");
    if (!person) return res.status(404).json({ message: "Profile not found." });
    
    res.status(200).json({ success: true, person });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ================== TOGGLE DUTY STATUS ==================
/**
 * PUT /api/delivery/toggle-duty
 * Logic: Allows rider to go "Available" or "Offline"
 * Prevents going offline if they currently have an active order
 */
exports.toggleDutyStatus = async (req, res) => {
  try {
    const { status } = req.body; // Expects "Available" or "Offline"
    const riderId = req.user.id;

    if (!["Available", "Offline"].includes(status)) {
      return res.status(400).json({ message: "Invalid status. Use 'Available' or 'Offline'." });
    }

    const rider = await DeliveryPerson.findById(riderId);
    if (!rider) return res.status(404).json({ message: "Rider not found." });

    // Prevent going offline if they are in the middle of a delivery
    if (rider.status === "On-Delivery" && status === "Offline") {
      return res.status(400).json({ 
        message: "You cannot go offline while you have an active delivery. Finish the task first!" 
      });
    }

    rider.status = status;
    await rider.save();

    res.status(200).json({ 
      success: true, 
      message: `Status updated to ${status}`, 
      currentStatus: rider.status 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};