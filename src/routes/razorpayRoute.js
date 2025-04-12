const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../controllers/RazorpayController");

// Create Razorpay order
router.post("/create-order", createOrder);

// Verify Razorpay payment
router.post("/verify", verifyPayment);

module.exports = router;
