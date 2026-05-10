const { Schema, model } = require("mongoose");

const warehouseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    address: {
      fullAddress: { type: String, required: true, trim: true }, // e.g., "123 Industrial Way"
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [Longitude, Latitude]
    },
    inventory: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 0 },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

warehouseSchema.index({ location: "2dsphere" });
module.exports = model("Warehouse", warehouseSchema);