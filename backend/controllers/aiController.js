const Product = require("../models/products");
const AIPreference = require("../models/aiPreference");
const Order = require("../models/orders");
const AIRecommend = require("../models/AIRecommend");


const Groq = require("groq-sdk");

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY 
});

/**
 * 1. AI Chat Query Controller
 */
exports.processAIQuery = async (req, res) => {
  try {
    const { text, userId } = req.body;
    if (!text) return res.status(400).json({ success: false, message: "Query text is required" });

    // --- A. AI INTENT EXTRACTION ---
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are YuKTI 2.0, CogniShop AI. Extract product search details.
          RULES:
          - "priceMax": Numeric if user says "under", "below".
          - "priceMin": Numeric if user says "above", "more than".
          - "minRating": Numeric if user says "rating above X".
          - "searchTerm": Core product item.
          Return ONLY JSON:
          {
            "category": string|null,
            "brand": string|null,
            "searchTerm": string|null,
            "priceMax": number|null,
            "priceMin": number|null,
            "minRating": number|null,
            "shouldSearch": boolean,
            "explanation": "Friendly text response"
          }`
        },
        { role: "user", content: text },
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" },
    });

    const ai = JSON.parse(completion.choices[0].message.content);
    let products = [];

    // --- B. DYNAMIC DATABASE SEARCH ---
    if (ai.shouldSearch) {
      const query = { isActive: true };

      if (ai.searchTerm) {
        query.$or = [
          { product_name: { $regex: ai.searchTerm, $options: "i" } },
          { description: { $regex: ai.searchTerm, $options: "i" } }
        ];
      }

      // Price & Rating logic
      if (ai.priceMax || ai.priceMin) {
        query.price = {};
        if (ai.priceMax) query.price.$lte = ai.priceMax;
        if (ai.priceMin) query.price.$gte = ai.priceMin;
      }
      if (ai.minRating) query.rating = { $gte: ai.minRating };

      // POPULATE dealerId to get the actual Dealer's brandName
      products = await Product.find(query)
        .populate("dealerId", "brandName")
        .limit(10)
        .lean();

      // Filter by Brand Name from the populated Dealer if brand is mentioned
      if (ai.brand) {
        products = products.filter(p => 
          (p.brand && p.brand.toLowerCase().includes(ai.brand.toLowerCase())) ||
          (p.dealerId?.brandName && p.dealerId.brandName.toLowerCase().includes(ai.brand.toLowerCase()))
        );
      }

      // FIX IMAGE PATHS: Ensure frontend gets full URLs if needed
      const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
      products = products.map(p => ({
        ...p,
        brand: p.dealerId?.brandName || p.brand || "Generic", // Priority to Dealer Brand
        images: p.images.map(img => img.startsWith("http") ? img : `${BASE_URL}${img}`)
      }));
    }

    // --- C. PREFERENCES ---
    if (userId) {
      await AIPreference.findOneAndUpdate(
        { userId },
        { $push: { recentQueries: { $each: [{ query: text }], $slice: -5 } } },
        { upsert: true }
      );
    }

    res.status(200).json({ success: true, message: ai.explanation, products });
  } catch (error) {
    console.error("❌ AI Error:", error);
    res.status(500).json({ success: false, message: "AI is offline." });
  }
};

exports.getSuggestedProducts = async (req, res) => {
  try {
    const { userId } = req.params;
    const profile = await AIRecommend.findOne({ userId });

    if (!profile) {
      // Fallback logic...
      return res.status(200).json({ success: true, products: [] });
    }

    // 1. Convert Category Names to ObjectIds
    const Category = require("../models/Category");
    const categoryDocs = await Category.find({ name: { $in: profile.preferredCategories } });
    const categoryIds = categoryDocs.map(c => c._id);

    // 2. The BROAD QUERY
    const suggested = await Product.find({
      isActive: true,
      $or: [
        // Rule: All products in matching Category IDs
        { category: { $in: categoryIds } },
        
        // Rule: Matches the Brand String in the Product Model
        { brand: { $in: profile.preferredBrands } },
        
        // Rule: First Word Match (Rule C)
        ...(profile.keywords.length > 0 ? [{ 
          product_name: { $regex: new RegExp(`^(${profile.keywords.join('|')})`, 'i') } 
        }] : [])
      ]
    })
    .populate("category", "name")
    .populate("dealerId", "brandName") // MUST POPULATE DEALER TO SEE BRAND NAME
    .limit(15)
    .lean();

    // 3. Format and include Dealer Brand if Product brand is "Generic"
    const formatted = suggested.map(p => {
      const actualBrand = p.dealerId?.brandName;
      
      return {
        ...p,
        display_name: p.product_name.split(' ')[0],
        category_name: p.category?.name || "Marketplace",
        brand_name: actualBrand // Send this to frontend
      };
    });
    res.status(200).json({ success: true, products: formatted });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAISuggestions = async (req, res) => {
  try {
    const { userId } = req.params;
    const prefs = await AIPreference.findOne({ userId }).lean();
    const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

    let query = {};
    if (prefs && (prefs.interestedCategories.length || prefs.preferredBrands.length)) {
      query = {
        $or: [
          { category_name: { $in: prefs.interestedCategories } },
          { brand: { $in: prefs.preferredBrands } }
        ]
      };
    }

    let suggestions = await Product.find(query)
      .populate("dealerId", "brandName")
      .limit(8)
      .lean();

    suggestions = suggestions.map(p => ({
      ...p,
      brand: p.dealerId?.brandName || p.brand || "Generic",
      images: p.images.map(img => img.startsWith("http") ? img : `${BASE_URL}${img}`)
    }));

    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.analyzeOrderForAI = async (orderId) => {
  try {
    // 1. Fetch the order with nested population
    const order = await Order.findById(orderId).populate({
      path: 'items.product',
      populate: [
        { path: 'category', select: 'name' },
        { path: 'dealerId', select: 'brandName' }
      ]
    });

    if (!order) return console.error("Order not found for AI Analysis");

    // 2. Extract Unique Categories and Brands
    // Using dealerId.brandName as priority, falling back to product.brand
    const categories = [...new Set(order.items.map(item => 
      item.product?.category?.name
    ).filter(Boolean))];

    const brands = [...new Set(order.items.map(item => 
      item.product?.dealerId?.brandName || item.product?.brand
    ).filter(Boolean))];

    // 3. Extract FIRST WORDS from product names
    // Rule: Take the very first word of the product name (e.g., "Samsung" from "Samsung A17")
    const firstWords = [...new Set(order.items.map(item => {
      const name = item.product?.product_name || item.product_name || "";
      return name.trim().split(/\s+/)[0].toLowerCase();
    }).filter(word => word.length > 2))];

    // 4. Update the profile
    // $addToSet ensures unique entries in the arrays
    await AIRecommend.findOneAndUpdate(
      { userId: order.user },
      { 
        $addToSet: { 
          preferredCategories: { $each: categories },
          preferredBrands: { $each: brands },
          keywords: { $each: firstWords } 
        },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    );

    console.log(`✅ AI Profile Updated for User: ${order.user} | First Words: ${firstWords}`);
  } catch (error) {
    console.error("❌ AI Analysis Error:", error);
  }
};