require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const Groq = require("groq-sdk");
const { v4: uuidv4 } = require('uuid');

// ================== 1. DB CONNECTION ==================
const connectDB = require("./config/db");
connectDB();

// ================== 2. ROUTE IMPORTS ==================
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");
const messageRoutes = require("./routes/messageRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const dealerRoutes = require("./routes/dealerRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const adminRoutes = require("./routes/adminRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes"); 
const aiRoutes = require("./routes/aiRoutes");

// ================== 3. MODELS & UTILS ==================
const Message = require("./models/message");
const DeliveryMessage = require("./models/DeliveryMessage");
const Order = require("./models/orders");
const Product = require("./models/products");
const AIPreference = require("./models/aiPreference");
const { encrypt } = require("./utils/cryptoUtils");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ================== 4. APP & SERVER INITIALIZATION ==================
const app = express();
const server = http.createServer(app);

// ================== 5. SOCKET.IO SETUP ==================
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  },
});

// ================== 6. MIDDLEWARES ==================
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ================== 7. API ROUTES ==================
app.use("/users", userRoutes);
app.use("/products", productRoutes);
app.use("/categories", categoryRoutes);
app.use("/orders", orderRoutes);
app.use("/messages", messageRoutes);
app.use("/feedbacks", feedbackRoutes);
app.use("/payment", paymentRoutes);
app.use("/warehouses", warehouseRoutes);
app.use("/dealers", dealerRoutes);
app.use("/admins", adminRoutes);
app.use("/delivery", deliveryRoutes);
app.use("/ai", aiRoutes);

// ================== 8. SOCKET.IO LOGIC ==================
io.on("connection", (socket) => {
  console.log("⚡ Socket Connected:", socket.id);

  // --- A. AI ASSISTANT CHAT (CogniShop AI) ---
  socket.on("join_chat", async ({ userId }) => {
    try {
      if (!userId) return;
      socket.join(userId);
    } catch (err) { console.error(err); }
  });

  socket.on("send_message", async ({ text, userId, sessionId }) => {
    try {
      if (!text || !userId) return;

      // 1. Identify or Create Session ID
      const currentSessionId = sessionId || uuidv4();

      // 2. Save User Message
      const userMsg = await Message.create({ 
        userId, 
        sender: "user", 
        text, 
        sessionId: currentSessionId 
      });
      
      // Echo immediately to the user
      io.to(userId).emit("receive_message", userMsg);

      // 3. AI Extraction Logic (Groq)
      const completion = await groq.chat.completions.create({
        messages: [
          { 
            role: "system", 
            content: `You are CogniShop AI. Analyze user intent. 
            RULES:
            - 'priceMax': numeric if user says "under", "below".
            - 'priceMin': numeric if user says "above", "more than".
            - 'minRating': numeric if user says "rating above X".
            - 'searchTerm': main product name.
            - 'brand': specific brand name mentioned.
            - 'shouldSearch': true if they want to find products.

            Return ONLY JSON: 
            { 
              "category": string|null, 
              "brand": string|null, 
              "searchTerm": string|null,
              "priceMax": number|null,
              "priceMin": number|null,
              "minRating": number|null,
              "shouldSearch": boolean,
              "text": "friendly reply" 
            }` 
          },
          { role: "user", content: text },
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });

      const ai = JSON.parse(completion.choices[0].message.content);
      let foundProducts = [];

      // 4. Dynamic Database Search (Integrated AI Search)
      if (ai.shouldSearch) {
        let mongoQuery = { isActive: true };

        if (ai.searchTerm) {
          mongoQuery.$or = [
            { product_name: { $regex: ai.searchTerm, $options: "i" } },
            { description: { $regex: ai.searchTerm, $options: "i" } }
          ];
        }

        if (ai.priceMax || ai.priceMin) {
          mongoQuery.price = {};
          if (ai.priceMax) mongoQuery.price.$lte = ai.priceMax;
          if (ai.priceMin) mongoQuery.price.$gte = ai.priceMin;
        }

        if (ai.minRating) {
          mongoQuery.rating = { $gte: ai.minRating };
        }

        let rawProducts = await Product.find(mongoQuery)
          .populate("dealerId", "brandName")
          .limit(10)
          .lean();

        const BASE_URL = process.env.BASE_URL || "http://localhost:5000";
        
        foundProducts = rawProducts.map(p => ({
          ...p,
          brand: p.dealerId?.brandName || p.brand || "Generic",
          images: p.images.map(img => img.startsWith("http") ? img : `${BASE_URL}${img}`)
        }));

        if (ai.brand) {
          foundProducts = foundProducts.filter(p => 
            p.brand.toLowerCase().includes(ai.brand.toLowerCase())
          );
        }
      }
      
      // 5. Save and Emit Bot Response
      const botMsg = await Message.create({ 
        userId, 
        sender: "bot", 
        text: ai.text,
        sessionId: currentSessionId,
        products: foundProducts 
      });

      io.to(userId).emit("receive_message", {
        ...botMsg._doc,
        sessionId: currentSessionId, 
        products: foundProducts 
      });

      // 6. Memory Update
      await AIPreference.findOneAndUpdate(
        { userId },
        { 
          $push: { recentQueries: { $each: [{ query: text }], $slice: -5 } },
          $addToSet: { 
            interestedCategories: ai.category || ai.searchTerm || [], 
            preferredBrands: ai.brand || [] 
          }
        },
        { upsert: true }
      ).catch(err => console.error("Pref Error:", err));

    } catch (err) {
      console.error("❌ AI Socket Error:", err);
      socket.emit("ai_error", "Assistant is temporarily offline.");
    }
  });

  // --- B. ENCRYPTED DELIVERY CHAT (User-to-Delivery) ---
  socket.on("join_delivery_chat", async ({ orderId }) => {
    try {
      const order = await Order.findById(orderId);
      if (order && order.chatActive) {
        socket.join(orderId);
        console.log(`📦 User joined delivery room: ${orderId}`);
      } else {
        socket.emit("delivery_error", "Chat is inactive.");
      }
    } catch (err) { console.error("Join Delivery Error:", err); }
  });

  // ... inside io.on("connection") ...

socket.on("send_delivery_message", async (data) => {
  try {
    const { orderId, senderId, senderModel, text, senderName } = data;

    // Use orderId to check if chat is active
    const order = await Order.findById(orderId);
    if (!order || !order.chatActive) return;

    // Fix: Use senderId from frontend to populate the 'sender' field in DB
    const { encryptedData, iv } = encrypt(text);
    
    const savedMsg = await DeliveryMessage.create({
      orderId,
      sender: senderId, // This was 'undefined' because keys didn't match
      senderModel: senderModel,
      text: encryptedData,
      iv: iv
    });

    // Broadcast to the room
    io.to(orderId).emit("receive_delivery_message", {
      _id: savedMsg._id,
      orderId,
      senderId,
      senderName,
      senderModel,
      text, // Plain text for real-time UI
      timestamp: new Date()
    });

  } catch (err) {
    console.error("❌ Socket Delivery Error:", err);
  }
});

  socket.on("disconnect", () => console.log("👋 Socket Disconnected"));
});

// ================== 9. BASE ENDPOINTS ==================
app.get("/", (req, res) => {
  res.send("🚀 CogniShop AI v2.5 - AI & Delivery Chat Fully Integrated");
});

// ================== 10. ERROR HANDLING ==================
app.use((err, req, res, next) => {
  console.error("🔴 SERVER ERROR:", err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

// ================== 11. START SERVER ==================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});