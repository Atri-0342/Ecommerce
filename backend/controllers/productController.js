const Product = require("../models/products");
const Warehouse = require("../models/warehouse");
const Category = require("../models/category");
const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- Helper: Delete Physical Files ---
const deletePhysicalFiles = (imagePaths) => {
  if (!imagePaths || !Array.isArray(imagePaths)) return;
  imagePaths.forEach((filePath) => {
    // Navigates from controllers folder to root/uploads
    const fullPath = path.join(__dirname, "..", filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlink(fullPath, (err) => {
        if (err) console.error("File deletion error:", err);
      });
    }
  });
};

// --- ✅ CREATE PRODUCT ---
exports.createProduct = async (req, res) => {
  try {
    const { product_name, price, discountPrice, description, stock, category, warehouseId } = req.body;
    const dealerId = req.user._id; 
    const imageUrls = req.files?.map((f) => `/uploads/${f.filename}`) || [];

    if (!category) return res.status(400).json({ success: false, message: "Category is required" });

    const categoryExists = await Category.findById(category);
    if (!categoryExists) return res.status(404).json({ success: false, message: "Invalid Category" });

    const product = await Product.create({
      product_name,
      dealerId,
      price: Number(price),
      discountPrice: Number(discountPrice || 0),
      description,
      stock: Number(stock),
      images: imageUrls,
      category,
    });

    if (warehouseId) {
      await Warehouse.findByIdAndUpdate(warehouseId, {
        $push: { inventory: { product: product._id, quantity: Number(stock) } }
      });
    }

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- ✅ UPDATE PRODUCT ---
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const isAdmin = ["SuperAdmin", "Moderator", "Editor"].includes(req.user.access_level);
    const isOwner = product.dealerId?.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    if (req.files && req.files.length > 0) {
      deletePhysicalFiles(product.images);
      req.body.images = req.files.map((f) => `/uploads/${f.filename}`);
    }

    // Ensure 'brand' is never re-inserted into the document
    delete req.body.brand;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("dealerId", "brandName");

    res.json({ success: true, product: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- ✅ DELETE PRODUCT ---
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const isAdmin = ["SuperAdmin", "Moderator", "Editor"].includes(req.user.access_level);
    const isOwner = product.dealerId?.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) return res.status(403).json({ message: "Access Denied" });

    deletePhysicalFiles(product.images);
    await Product.findByIdAndDelete(req.params.id);

    await Warehouse.updateMany(
      { "inventory.product": req.params.id },
      { $pull: { inventory: { product: req.params.id } } }
    );

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Delete operation failed" });
  }
};

// --- ✅ GET SINGLE PRODUCT ---
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category", "name")
      .populate("dealerId", "brandName ownerName") 
      .populate("reviews.user", "name image");
      
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch {
    res.status(500).json({ message: "Invalid Product ID" });
  }
};

// --- ✅ GET ALL PRODUCTS ---
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("category", "name")
      .populate("dealerId", "brandName ownerName email")
      .sort("-createdAt");
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// --- ✅ GET PRODUCTS BY CATEGORY ---
exports.getProductsByCategory = async (req, res) => {
  try {
    const products = await Product.find({ category: req.params.categoryId })
      .populate("category", "name")
      .populate("dealerId", "brandName");
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ message: "Error fetching category products" });
  }
};

// --- ✅ GET DEALER PRODUCTS ---
exports.getDealerProducts = async (req, res) => {
  try {
    const products = await Product.find({ dealerId: req.user._id })
      .populate("category", "name")
      .populate("dealerId", "brandName")
      .sort("-createdAt");
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- ✅ CREATE REVIEW ---
exports.createReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) return res.status(404).json({ message: "Product not found" });

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) return res.status(400).json({ message: "Already reviewed" });

    const review = {
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

    await product.save();
    res.status(201).json({ success: true, message: "Review added" });
  } catch (err) {
    res.status(500).json({ message: "Review failed" });
  }
};

// --- ✅ TRACK CLICK ---
exports.trackClick = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { $inc: { clickCount: 1 } }, { new: true });
    res.json({ success: true, clickCount: product?.clickCount });
  } catch (err) {
    res.status(500).json({ message: "Tracking error" });
  }
};

// --- ✅ AI RECOMMENDATIONS ---
exports.getAIRecommendations = async (req, res) => {
  try {
    const currentProduct = await Product.findById(req.params.id);
    if (!currentProduct) return res.status(404).json({ message: "Not found" });

    const candidates = await Product.find({
      _id: { $ne: req.params.id },
      category: currentProduct.category,
      isActive: true
    }).limit(15);

    const prompt = `Based on product: ${currentProduct.product_name}, pick 4 IDs: ${JSON.stringify(candidates.map(p => ({ id: p._id, name: p.product_name })))}. Return ONLY a JSON array of strings.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
    });

    const ids = JSON.parse(completion.choices[0].message.content.match(/\[.*\]/s)[0]);
    const products = await Product.find({ _id: { $in: ids } }).populate("category", "name").populate("dealerId", "brandName");
    
    res.json({ success: true, products });
  } catch (err) {
    const fallback = await Product.find({ category: currentProduct.category, _id: { $ne: req.params.id } }).limit(4).populate("dealerId", "brandName");
    res.json({ success: true, products: fallback });
  }
};