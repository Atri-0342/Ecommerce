const Category = require("../models/Category");

// --- CREATE CATEGORY ---
exports.createCategory = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    // Process file path from Multer
    let imagePath = "";
    if (req.file) {
      imagePath = `/uploads/${req.file.filename}`.replace(/\\/g, "/");
    }

    const category = await Category.create({
      name,
      description,
      image: imagePath,
      // Convert string "true"/"false" from FormData to Boolean
      isActive: isActive === "false" ? false : true, 
    });

    res.status(201).json({ success: true, category });
  } catch (err) {
    console.error("Backend Create Error:", err);

    if (err.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: "Category name already exists." 
      });
    }

    res.status(500).json({ success: false, message: err.message });
  }
};

// --- UPDATE CATEGORY ---
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;
    
    let updateData = {};

    // Handle standard form fields if they exist in the request
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    
    // Handle status toggle (works for both JSON and FormData)
    if (isActive !== undefined) {
      updateData.isActive = isActive === "false" || isActive === false ? false : true;
    }

    // Handle image upload
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`.replace(/\\/g, "/");
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, category });
  } catch (err) {
    console.error("Backend Update Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- GET ALL CATEGORIES ---
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- DELETE CATEGORY ---
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};