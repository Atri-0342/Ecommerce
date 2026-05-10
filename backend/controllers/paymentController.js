const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../models/orders");

// Initialize Razorpay
const getRazorpayInstance = () => {
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
};

exports.checkout = async (req, res) => {
    try {
        const instance = getRazorpayInstance();
        
        // Convert amount to Paise (1 INR = 100 Paise)
        const amount = Math.round(Number(req.body.amount) * 100);

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: "Invalid amount" });
        }

        const options = {
            amount: amount,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await instance.orders.create(options);
        res.status(200).json({ success: true, order });
    } catch (error) {
        console.error("RAZORPAY CHECKOUT ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.paymentVerification = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;

        // Verify Signature
        const generated_signature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature === razorpay_signature) {
            // Save to Database
            const newOrder = new Order({
                ...orderData,
                payment: "paid",
                razorpay_payment_id,
                status: "Ordered",
            });

            await newOrder.save();
            res.status(200).json({ success: true, message: "Payment Verified" });
        } else {
            res.status(400).json({ success: false, message: "Invalid Signature" });
        }
    } catch (error) {
        console.error("VERIFY ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};