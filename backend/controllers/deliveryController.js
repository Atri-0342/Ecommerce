const Order = require("../models/orders");
const DeliveryPerson = require("../models/DeliveryPerson");

/**
 * PATCH /api/delivery/update-location
 * Updates rider's live coordinates for real-time tracking
 */
exports.updateRiderLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const riderId = req.user.id;

    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ message: "Latitude and Longitude are required." });
    }

    const updatedRider = await DeliveryPerson.findByIdAndUpdate(
      riderId,
      {
        location: {
          type: "Point",
          coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON: [Longitude, Latitude]
        },
        lastUpdated: Date.now()
      },
      { new: true }
    );

    res.status(200).json({ 
      success: true, 
      message: "Location updated", 
      coords: updatedRider.location.coordinates 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET /api/delivery/my-tasks
 * Fetches the active order assigned to the rider. 
 * Includes customer lat/lon for the map.
 */
exports.getMyActiveOrder = async (req, res) => {
  try {
    const riderId = req.user.id;
    const deliveryBoy = await DeliveryPerson.findById(riderId);
    
    if (!deliveryBoy) {
      return res.status(404).json({ success: false, message: "Rider not found." });
    }

    if (!deliveryBoy.currentOrder) {
      return res.status(200).json({ 
        success: true, 
        message: "No active task.", 
        order: null 
      });
    }

    // Populate user (customer) for destination coords and product info for the list
    const order = await Order.findById(deliveryBoy.currentOrder)
      .populate("user", "name phone shipAddress lat lon") 
      .populate("items.product", "product_name image");

    // SELF-HEALING: If order ID exists on rider but Order document is missing
    if (!order) {
      await DeliveryPerson.findByIdAndUpdate(riderId, { 
        currentOrder: null, 
        status: "Available" 
      });
      return res.status(200).json({ 
        success: true, 
        message: "Assigned order no longer exists. Status reset.", 
        order: null 
      });
    }

    res.status(200).json({ 
      success: true, 
      order,
      riderLocation: deliveryBoy.location 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * PUT /api/delivery/update-status
 * Logic for completing delivery via OTP or cancelling the task
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { orderId, newStatus, otpInput, cancelReason } = req.body;
    const deliveryBoyId = req.user.id; 

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Verify assignment security
    if (order.deliveryPartner.toString() !== deliveryBoyId) {
      return res.status(403).json({ message: "Unauthorized. Assignment mismatch." });
    }

    // --- CASE: DELIVERED ---
    if (newStatus === "Delivered") {
      if (order.deliveryOTP !== otpInput) {
        return res.status(400).json({ message: "Invalid OTP. Delivery cannot be finalized." });
      }

      order.status = "Delivered";
      order.chatActive = false;
      await order.save();

      await DeliveryPerson.findByIdAndUpdate(deliveryBoyId, {
        status: "Available",
        currentOrder: null,
        $inc: { totalDeliveries: 1 }
      });

      return res.status(200).json({ success: true, message: "Order Delivered!" });
    }

    // --- CASE: CANCELLED ---
    if (newStatus === "Cancelled") {
      order.status = "Cancelled";
      order.chatActive = false;
      order.cancelReason = cancelReason || "Cancelled by rider"; 
      await order.save();

      await DeliveryPerson.findByIdAndUpdate(deliveryBoyId, {
        status: "Available",
        currentOrder: null
      });

      return res.status(200).json({ success: true, message: "Order Cancelled." });
    }

    return res.status(400).json({ message: "Invalid status update request." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};