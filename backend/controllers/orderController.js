const { analyzeOrderForAI } = require("./aiController"); // Import the analysis function
const Order = require("../models/orders");
const Product = require("../models/products");
const Warehouse = require("../models/warehouse");
const DeliveryPerson = require("../models/DeliveryPerson");
const AIRecommend = require("../models/AIRecommend");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const axios = require("axios");

/**
 * --- HELPER: UNIVERSAL EMAIL SENDER ---
 * Configured for Gmail SMTP with HTML support
 */
const sendOrderEmail = async (to, subject, userName, bodyContent) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"MyShop Support" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 15px; max-width: 600px; margin: auto;">
          <div style="text-align: center; border-bottom: 2px solid #0d6efd; padding-bottom: 10px;">
            <h1 style="color: #0d6efd; margin: 0;">MyShop</h1>
          </div>
          <div style="padding: 20px 0;">
            <h2 style="color: #333;">Order Notification</h2>
            <p style="font-size: 16px; color: #555;">Hi <strong>${userName}</strong>,</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 10px; color: #444;">
              ${bodyContent}
            </div>
          </div>
          <div style="text-align: center; font-size: 12px; color: #aaa;">
            <p>© 2026 MyShop Inc. | Anandapur, Kolkata, West Bengal</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`[Email] Success: ${to}`);
  } catch (error) {
    console.error("[Email] Error:", error.message);
  }
};

/**
 * --- HELPER: SMS SIMULATION ---
 */
const sendSMSNotification = async (phone, message) => {
  try {
    console.log(`[SMS Simulation] To ${phone}: ${message}`);
  } catch (error) {
    console.error("[SMS] Error:", error.message);
  }
};

/**
 * 1. GET RIDER TASKS (The Dashboard Fix)
 * Fetches current assigned task and available tasks at the rider's warehouse
 */
exports.getMyActiveOrder = async (req, res) => {
  try {
    const deliveryBoyId = req.user.id;
    const deliveryBoy = await DeliveryPerson.findById(deliveryBoyId);

    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: "Delivery person record not found." });
    }

    // A. Active Order assigned to this specific rider
    let active = [];
    if (deliveryBoy.currentOrder) {
      const activeOrder = await Order.findById(deliveryBoy.currentOrder)
        .populate("user", "name phone")
        .populate("items.product", "product_name images price");
      if (activeOrder) active = [activeOrder];
    }

    // B. Available Orders waiting at the rider's assigned warehouse
    const available = await Order.find({
      status: "Processing",
      assignedWarehouse: deliveryBoy.assignedWarehouse,
      deliveryPartner: { $exists: false }
    }).populate("user", "name");

    res.status(200).json({ success: true, active, available });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 2. CREATE ORDER
 * Logic: Atomic transaction for stock management, handles COD/Online
 */
exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { user, items, total, shipAddress, payment, email, userName, phone } = req.body;

    if (!items || items.length === 0) throw new Error("Your cart is empty.");
    if (!email || !phone) throw new Error("Contact information (email/phone) is required.");

    // 1. Stock Management Loop
    for (const item of items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) throw new Error(`Product not found.`);
      
      if (product.stock < item.quantity) {
        throw new Error(`Only ${product.stock} units of ${product.product_name} left.`);
      }
      
      product.stock -= item.quantity;
      await product.save({ session });
    }

    // 2. Create and Save Order
    const newOrder = new Order({
      user, email, phone, items, total, shipAddress, payment,
      status: "Ordered"
    });

    await newOrder.save({ session });

    // 3. Commit Transaction
    await session.commitTransaction();
    session.endSession();

    // ======================================================
    // 🤖 AI TRIGGER: ANALYZE ORDER IN THE BACKGROUND
    // ======================================================
    analyzeOrderForAI(newOrder._id).catch(err => 
      console.error("AI Recommendation Analysis Error:", err)
    );

    // 4. Notifications (Post-Transaction)
    const paymentLabel = payment === "cod" ? "Cash on Delivery" : "Paid via Online";
    const statusColor = payment === "cod" ? "#dc3545" : "#198754";

    const emailBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #0d6efd;">Order Confirmed!</h2>
        <p>Hello <strong>${userName || "Customer"}</strong>,</p>
        <p>Your order <strong>#${newOrder._id.toString().slice(-6).toUpperCase()}</strong> has been placed successfully.</p>
        <hr/>
        <p><strong>Total Amount:</strong> <span style="color: #198754; font-size: 18px;">₹${total}</span></p>
        <p><strong>Payment Method:</strong> <span style="color: ${statusColor};">${paymentLabel}</span></p>
        <p><strong>Shipping Address:</strong> ${shipAddress}</p>
        <hr/>
        <p>Thank you for shopping with CogniShop!</p>
      </div>
    `;
    
    // Fix: Added await
    await sendOrderEmail(email, "Order Confirmed - CogniShop", userName || "Customer", emailBody);
    sendSMSNotification(phone, `CogniShop: Order confirmed! Total: ₹${total}. ID: ${newOrder._id.toString().slice(-6).toUpperCase()}`);

    // 5. Final Response
    res.status(201).json({ 
      success: true, 
      orderId: newOrder._id,
      message: "Order placed and AI profile updated."
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Create Order Error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.shipToNearestWarehouse = async (req, res) => {
  try {
    const { orderId } = req.params;

    // 1. Fetch Order with User details
    const order = await Order.findById(orderId).populate("user");
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // 2. Validation: Prevent shipping unless packed
    if (order.status !== "Packed") {
      return res.status(400).json({ 
        success: false, 
        message: "Status Error: Order must be 'Packed' before it can be shipped." 
      });
    }

    // 3. Geocode Shipping Address
    const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: order.shipAddress, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'YuKTI-Logistics/1.1' }
    });

    if (!geoRes.data || geoRes.data.length === 0) {
      return res.status(400).json({ success: false, message: "Geocoding failed for address." });
    }

    const lat = parseFloat(geoRes.data[0].lat);
    const lon = parseFloat(geoRes.data[0].lon);

    // 4. Find the Nearest Active Warehouse (using 2dsphere index)
    const nearestWh = await Warehouse.findOne({
      isActive: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lon, lat] }, // [Long, Lat]
        },
      },
    });

    if (!nearestWh) {
      return res.status(404).json({ success: false, message: "No active warehouse found near this location." });
    }

    // 5. AUTO-ASSIGN DELIVERY PARTNER
    // Query: Must be Available, Active, and specifically assigned to THIS warehouse
    const availablePartners = await DeliveryPerson.find({
      assignedWarehouse: nearestWh._id,
      status: "Available",
      isActive: true
    });

    if (availablePartners.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Warehouse ${nearestWh.name} identified, but no available riders are currently clocked in there.` 
      });
    }

    // Randomly select one rider from the available pool
    const randomIndex = Math.floor(Math.random() * availablePartners.length);
    const assignedPartner = availablePartners[randomIndex];

    // 6. ATOMIC INVENTORY TRANSFER
    // Move stock from global/dealer inventory to the local Warehouse inventory
    const inventoryUpdates = order.items.map(async (item) => {
      const updatedWh = await Warehouse.findOneAndUpdate(
        { _id: nearestWh._id, "inventory.product": item.product },
        { $inc: { "inventory.$.quantity": item.quantity } },
        { new: true }
      );

      if (!updatedWh) {
        // If product didn't exist in warehouse array, push it
        return Warehouse.findByIdAndUpdate(nearestWh._id, {
          $push: { inventory: { product: item.product, quantity: item.quantity } }
        });
      }
      return updatedWh;
    });
    await Promise.all(inventoryUpdates);

    // 7. FINALIZE ORDER & PARTNER UPDATES
    const deliveryOTP = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Update Order details
    order.status = "Shipped";
    order.assignedWarehouse = nearestWh._id;
    order.deliveryPartner = assignedPartner._id; // <--- The Assignment
    order.deliveryOTP = deliveryOTP;
    order.lat = lat;
    order.lon = lon;
    order.chatActive = true; 
    await order.save();

    // Update Partner details (Mark as Busy)
    assignedPartner.status = "On-Delivery";
    assignedPartner.currentOrder = order._id;
    await assignedPartner.save();

    // 8. NOTIFICATIONS
    const orderShortId = order._id.toString().slice(-6).toUpperCase();
    
    const emailTemplate = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #2ecc71;">Your Order is Out for Delivery! 🚀</h2>
        <p>Order <b>#${orderShortId}</b> has been picked up by <b>${assignedPartner.name}</b> from our <b>${nearestWh.name}</b> hub.</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
           <p style="margin: 0;">Share this OTP with the rider only upon delivery:</p>
           <h1 style="color: #3498db; letter-spacing: 4px;">${deliveryOTP}</h1>
        </div>
      </div>
    `;

    await sendOrderEmail(order.email, `Out for Delivery - #${orderShortId}`, order.user?.name || "Customer", emailTemplate);
    
    sendSMSNotification(
        order.phone, 
        `Order #${orderShortId} shipped! Rider: ${assignedPartner.name}. Provide OTP ${deliveryOTP} at delivery.`
    );

    // 9. RESPONSE
    return res.status(200).json({
      success: true,
      message: "Order successfully shipped and rider assigned.",
      data: {
        orderId: order._id,
        warehouse: nearestWh.name,
        rider: assignedPartner.name,
        otp: deliveryOTP
      }
    });

  } catch (err) {
    console.error("Logistics Failure:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Logistics error occurred: " + err.message 
    });
  }
};

exports.shipOrderAndAssignPartner = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).populate("user");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // A. Geocoding Shipping Address using Nominatim
    const geoRes = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: { q: order.shipAddress, format: 'json', limit: 1 },
      headers: { 'User-Agent': 'MyShop/1.0' }
    });

    if (!geoRes.data.length) throw new Error("Could not locate shipping address.");
    const lat = parseFloat(geoRes.data[0].lat);
    const lon = parseFloat(geoRes.data[0].lon);

    // B. Finding Nearest Warehouse
    const nearestWarehouse = await Warehouse.findOne({
      isActive: true,
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lon, lat] }
        }
      }
    });

    if (!nearestWarehouse) throw new Error("No warehouse serving this area.");

    // C. Finding Available Partner at that Warehouse
    const partner = await DeliveryPerson.findOne({
      assignedWarehouse: nearestWarehouse._id,
      status: "Available",
      isActive: true
    });

    if (!partner) return res.status(400).json({ 
      success: false, 
      message: `No delivery partners available at the ${nearestWarehouse.name} warehouse.` 
    });

    // D. OTP Generation & Status Update
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    order.status = "Shipped";
    order.deliveryOTP = otp;
    order.deliveryPartner = partner._id;
    order.assignedWarehouse = nearestWarehouse._id;
    order.chatActive = true; 
    await order.save();

    // E. Partner Status Update
    partner.status = "On-Delivery";
    partner.currentOrder = order._id;
    await partner.save();

    // F. Notifications - Fix: Added await
    await sendOrderEmail(
        order.email, 
        "Your Order is Out for Delivery!", 
        order.user?.name || "Customer", 
        `Your package has left the ${nearestWarehouse.name} warehouse. <br> Provide this OTP to the rider: <h2 style="color:#0d6efd;">${otp}</h2>`
    );

    res.status(200).json({ 
      success: true, 
      message: "Order shipped and partner assigned", 
      warehouse: nearestWarehouse.name, 
      partner: partner.name, 
      otp 
    });

  } catch (error) {
    console.error("Shipment Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. UPDATE DELIVERY STATUS (OTP Verification)
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId, newStatus, otpInput, cancelReason } = req.body;
    const deliveryBoyId = req.user.id; 

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // 🛡️ SECURITY: Verify assigned rider
    if (order.deliveryPartner.toString() !== deliveryBoyId) {
      return res.status(403).json({ success: false, message: "Unauthorized. You are not assigned to this order." });
    }

    // --- CASE 1: DELIVERED ---
    if (newStatus === "Delivered") {
      if (order.deliveryOTP !== otpInput) {
        return res.status(400).json({ success: false, message: "Invalid OTP. Please check with the customer." });
      }

      order.status = "Delivered";
      order.chatActive = false;
      await order.save();

      await DeliveryPerson.findByIdAndUpdate(deliveryBoyId, {
        status: "Available",
        currentOrder: null,
        $inc: { totalDeliveries: 1 }
      });

      return res.status(200).json({ success: true, message: "Order successfully delivered!" });
    }

    // --- CASE 2: CANCELLED ---
    if (newStatus === "Cancelled") {
      order.status = "Cancelled";
      order.chatActive = false;
      order.cancelReason = cancelReason || "Delivery attempt failed";
      await order.save();

      await DeliveryPerson.findByIdAndUpdate(deliveryBoyId, {
        status: "Available",
        currentOrder: null
      });

      return res.status(200).json({ success: true, message: "Order marked as Cancelled." });
    }

    return res.status(400).json({ success: false, message: "Invalid status request." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NEW: Feedback Handler
exports.submitFeedback = async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;

    // 1. Find the order and ensure it has a delivery partner assigned
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    
    if (!order.deliveryPartner) {
      return res.status(400).json({ message: "No delivery partner assigned to this order" });
    }

    // 2. Prevent multiple reviews for the same order
    if (order.reviewed) {
      return res.status(400).json({ message: "Feedback already submitted for this order" });
    }

    // 3. Mark order as reviewed
    order.reviewed = true;
    await order.save();

    // 4. Update the DeliveryPerson's performance metrics
    const rider = await DeliveryPerson.findById(order.deliveryPartner);
    
    if (rider) {
      const currentTotal = rider.totalDeliveries || 0;
      const currentAvg = rider.rating || 5;
      const newRating = ((currentAvg * currentTotal) + rating) / (currentTotal + 1);
      
      rider.rating = Number(newRating.toFixed(1)); 
      await rider.save();
    }

    res.status(200).json({ success: true, message: "Thank you for your feedback!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDealerOrders = async (req, res) => {
  try {
    const merchantId = req.user._id; 

    // Find all products owned by this dealer
    const dealerProductIds = await Product.find({ dealerId: merchantId }).distinct("_id");

    // Find orders containing any of those products
    const orders = await Order.find({ "items.product": { $in: dealerProductIds } })
      .populate("user", "name email phone")
      .populate("items.product", "product_name images price dealerId brand")
      .sort({ createdAt: -1 });

    const filteredOrders = orders.map(order => {
      const orderObj = order.toObject();
      
      // Filter out items that don't belong to the logged-in dealer
      orderObj.items = orderObj.items.filter(item => 
        item.product && item.product.dealerId.toString() === merchantId.toString()
      );
      
      // Calculate specific dealer total for this order
      orderObj.dealerTotal = orderObj.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      return orderObj;
    });

    res.status(200).json({ success: true, orders: filteredOrders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id).populate("items.product").populate("user");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Restore stock if moving to Cancelled state
    if (status === "Cancelled" && order.status !== "Cancelled") {
      for (const item of order.items) {
        if (item.product) {
          item.product.stock += item.quantity;
          await item.product.save();
        }
      }
    }

    order.status = status;
    await order.save();

    // Fix: Added await and used populated name
    await sendOrderEmail(
        order.email, 
        `Order Status Update: ${status}`, 
        order.user?.name || "Customer", 
        `The status of order #${order._id.toString().slice(-6).toUpperCase()} is now: <strong>${status}</strong>`
    );
    
    res.status(200).json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 7. CORE GETTERS & ADMIN FUNCTIONS
 */
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({})
      .populate("user", "name email phone") 
      .populate("deliveryPartner", "name") 
      .populate({
        path: "items.product",
        populate: {
          path: "dealerId",
          model: "Dealer",
          select: "brandName ownerName email phone panNumber status" 
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ 
      success: true, 
      count: orders.length, 
      orders 
    });
  } catch (error) {
    console.error("Backend getAllOrders Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrdersByUser = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId })
      .populate("items.product", "product_name images price")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, orders });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone address")
      .populate("items.product")
      .populate("deliveryPartner", "name phone")
      .populate("assignedWarehouse", "name address");
    
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.status(200).json({ success: true, order });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (order && order.deliveryPartner) {
        await DeliveryPerson.findByIdAndUpdate(order.deliveryPartner, { status: "Available", currentOrder: null });
    }
    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Order record deleted permanently" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Aliases for cross-module compatibility
exports.shipOrder = exports.shipOrderAndAssignPartner;
exports.verifyOTPAndCompleteDelivery = exports.updateDeliveryStatus;