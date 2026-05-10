const Warehouse = require("../models/warehouse");

// --- ➕ CREATE WAREHOUSE ---
exports.createWarehouse = async (req, res) => {
  try {
    const { name, fullAddress, city, state, country, pincode, longitude, latitude } = req.body;

    const warehouse = await Warehouse.create({
      name,
      address: { fullAddress, city, state, country, pincode },
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });

    res.status(201).json({ success: true, message: "Warehouse created", warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- 📝 EDIT WAREHOUSE ---
// --- 📝 EDIT WAREHOUSE ---
exports.updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, fullAddress, city, state, country, pincode, longitude, latitude, isActive } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (typeof isActive === "boolean") updateData.isActive = isActive;

    // Use dot notation to update specific nested fields without wiping others
    if (fullAddress) updateData["address.fullAddress"] = fullAddress;
    if (city) updateData["address.city"] = city;
    if (state) updateData["address.state"] = state;
    if (country) updateData["address.country"] = country;
    if (pincode) updateData["address.pincode"] = pincode;

    // Location Update - ensure it's valid numbers
    if (longitude !== undefined && latitude !== undefined) {
      updateData.location = {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      };
    }

    const warehouse = await Warehouse.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
    res.status(200).json({ success: true, message: "Warehouse updated", warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- 📦 REMOVE SPECIFIC SKU FROM INVENTORY ---
// --- 📦 REMOVE SPECIFIC SKU FROM INVENTORY ---
exports.removeSKU = async (req, res) => {
  try {
    const { id, productId } = req.params;

    // Use $pull to remove the specific inventory item matching the productId
    const warehouse = await Warehouse.findByIdAndUpdate(
      id,
      { 
        $pull: { inventory: { product: productId } } 
      },
      { new: true } // Return the updated document
    ).populate("inventory.product"); // Populate to return fresh data to the frontend

    if (!warehouse) {
      return res.status(404).json({ 
        success: false, 
        message: "Warehouse not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "SKU removed from inventory", 
      inventory: warehouse.inventory 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      message: "Server error: " + err.message 
    });
  }
};

// --- 🗑️ DELETE WAREHOUSE ---
exports.deleteWarehouse = async (req, res) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });

    res.status(200).json({ success: true, message: "Warehouse deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- 🔍 GET ALL WAREHOUSES ---
exports.getAllWarehouses = async (req, res) => {
  try {
    const warehouses = await Warehouse.find().populate("inventory.product");
    res.status(200).json({ success: true, count: warehouses.length, warehouses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- 📍 FIND NEAREST WAREHOUSE ---
exports.getNearestWarehouse = async (req, res) => {
  try {
    const { longitude, latitude } = req.query;
    if (!longitude || !latitude) {
      return res.status(400).json({ message: "Coordinates (long/lat) are required" });
    }

    const warehouse = await Warehouse.findOne({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
        },
      },
    });

    res.status(200).json({ success: true, warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// --- 📦 UPDATE STOCK ---
exports.updateStock = async (req, res) => {
  try {
    const { warehouseId, productId, quantity } = req.body;

    // Try to update existing product in inventory
    let warehouse = await Warehouse.findOneAndUpdate(
      { _id: warehouseId, "inventory.product": productId },
      { $inc: { "inventory.$.quantity": Number(quantity) } },
      { new: true }
    );

    // If product doesn't exist in that warehouse, push a new entry
    if (!warehouse) {
      warehouse = await Warehouse.findByIdAndUpdate(
        warehouseId,
        { $push: { inventory: { product: productId, quantity: Number(quantity) } } },
        { new: true }
      );
    }

    if (!warehouse) return res.status(404).json({ message: "Warehouse not found" });
    res.status(200).json({ success: true, message: "Stock updated", warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// --- 🌎 GET COORDINATES (BACKEND PROXY) ---
exports.getCoordinates = async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) return res.status(400).json({ message: "Address is required" });

    // We make the request from the server, avoiding CORS issues
    const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
      params: {
        q: address,
        format: 'json',
        limit: 1
      },
      headers: {
        // REQUIRED by Nominatim: Identify your app
        'User-Agent': 'LogisticsApp/1.0 (contact@yourdomain.com)' 
      }
    });

    if (response.data.length > 0) {
      const { lat, lon } = response.data[0];
      res.status(200).json({ success: true, lat, lon });
    } else {
      res.status(404).json({ success: false, message: "Location not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Geocoding failed" });
  }
};