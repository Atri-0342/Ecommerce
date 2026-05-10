const { Schema, model } = require("mongoose");

const deliveryMessageSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    // Explicit reference to the Customer
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Explicit reference to the Delivery Boy / Rider
    deliveryId: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryPerson", // Ensure this matches your Rider model name
      required: true,
    },
    // We still keep 'sender' to know who actually wrote THIS specific message
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["User", "DeliveryPerson"],
    },
    text: {
      type: String, 
      required: true,
    },
    iv: {
      type: String, 
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = model("DeliveryMessage", deliveryMessageSchema);