const Razorpay = require("razorpay");
const Transaction = require("../models/Transaction");
require("dotenv").config();
const crypto = require("crypto");

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,  // Your Razorpay Key ID
  key_secret: process.env.RAZORPAY_KEY_SECRET,  // Your Razorpay Key Secret
});

// Create Razorpay order
exports.createOrder = async (req, res) => {
  const { amount } = req.body; // Amount should be passed in paise (1 INR = 100 paise)

  if (!amount) {
    return res.status(400).json({ message: "Amount is required" });
  }

  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: `receipt_${Math.random().toString(36).substring(7)}`,
    };

    // Create the Razorpay order
    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      razorpayKey: process.env.RAZORPAY_KEY_ID,  // Pass Razorpay Key to frontend for initiating the payment
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({ message: "Error creating Razorpay order" });
  }
};

// Verify Razorpay payment
exports.verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature , paidamount} = req.body;
  const userId = req.user.id; // you said req.user is available

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    await Transaction.create({
      user: userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status: "failed",
      paidamount:paidamount,
      reason: "Missing payment details",
    });
    return res.status(400).json({ message: "Missing payment details" });
  }

  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
  const generated_signature = hmac.digest("hex");

  if (generated_signature !== razorpay_signature) {
    await Transaction.create({
      user: userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status: "failed",
      paidamount:paidamount,
      reason: "Signature mismatch",
    });
    return res.status(400).json({ message: "Payment signature mismatch" });
  }

  try {
    await Transaction.create({
      user: userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      status: "success",
      paidamount:paidamount,
    });

    res.json({ message: "Payment verification successful!" });
  } catch (error) {
    console.error("Error saving transaction:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};