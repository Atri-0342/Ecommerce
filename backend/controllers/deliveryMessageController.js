const DeliveryMessage = require("../models/DeliveryMessage");
const Order = require("../models/orders");
const { encrypt, decrypt } = require("../utils/cryptoUtils");

// ==========================================
// 1. USER SEND MESSAGE (Check by Email)
// ==========================================
exports.userSendMessage = async (req, res) => {
  try {
    const { orderId, text } = req.body;
    // Get email from the decoded token (provided by protect middleware)
    const loggedInUserEmail = req.user.email; 

    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, message: "Message cannot be empty" });
    }

    // We populate 'user' to get the email address linked to the order
    const order = await Order.findById(orderId).populate("user", "email");
    
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // EMAIL CHECK: Compare logged-in email with Order owner's email
    if (order.user.email !== loggedInUserEmail) {
      console.log(`Access Denied: ${loggedInUserEmail} tried to message an order owned by ${order.user.email}`);
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: This email does not match the order owner" 
      });
    }

    // Status check
    if (typeof order.isChatAllowed === 'function' && !order.isChatAllowed()) {
      return res.status(403).json({ success: false, message: "Chat is not active" });
    }

    const { encryptedData, iv } = encrypt(text);

    const newMessage = await DeliveryMessage.create({
      orderId: order._id,
      userId: order.user._id,
      deliveryId: order.deliveryPartner,
      sender: req.user._id,
      senderModel: "User",
      text: encryptedData,
      iv: iv,
    });

    res.status(201).json({
      success: true,
      data: { _id: newMessage._id, text, senderModel: "User", createdAt: newMessage.createdAt }
    });

  } catch (error) {
    console.error("Email Auth Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 2. DELIVERY SEND MESSAGE (Check by Email)
// ==========================================
exports.deliverySendMessage = async (req, res) => {
  try {
    const { orderId, text } = req.body;
    const loggedInRiderEmail = req.user.email;

    // Populate deliveryPartner to get their email
    const order = await Order.findById(orderId).populate("deliveryPartner", "email");
    
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    if (!order.deliveryPartner || order.deliveryPartner.email !== loggedInRiderEmail) {
      return res.status(403).json({ success: false, message: "Unauthorized: You are not the assigned rider" });
    }

    const { encryptedData, iv } = encrypt(text);

    const newMessage = await DeliveryMessage.create({
      orderId: order._id,
      userId: order.user,
      deliveryId: order.deliveryPartner._id,
      sender: req.user._id,
      senderModel: "DeliveryPerson",
      text: encryptedData,
      iv: iv,
    });

    res.status(201).json({
      success: true,
      data: { _id: newMessage._id, text, senderModel: "DeliveryPerson", createdAt: newMessage.createdAt }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
// ==========================================
// 3. GET CHAT HISTORY
// ==========================================
exports.getDeliveryChatHistory = async (req, res) => {
  try {
    const { orderId } = req.params;
    const loggedInUserId = req.user?._id || req.user?.id;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const isCustomer = order.user.toString() === loggedInUserId.toString();
    const isRider = order.deliveryPartner && order.deliveryPartner.toString() === loggedInUserId.toString();

    if (!isCustomer && !isRider) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const messages = await DeliveryMessage.find({ orderId }).sort({ createdAt: 1 });

    const decryptedHistory = messages.map((msg) => {
      try {
        return {
          _id: msg._id,
          sender: msg.sender,
          senderModel: msg.senderModel,
          text: decrypt(msg.text, msg.iv),
          createdAt: msg.createdAt,
        };
      } catch (err) {
        return {
          _id: msg._id,
          sender: msg.sender,
          senderModel: msg.senderModel,
          text: "[Encrypted Message]",
          createdAt: msg.createdAt,
        };
      }
    });

    res.status(200).json({ success: true, data: decryptedHistory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};