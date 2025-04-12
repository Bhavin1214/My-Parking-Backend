const express = require("express");
const router = express.Router();
const { createOrder, verifyPayment } = require("../controllers/RazorpayController");
const authMiddleware = require("../middleware/authMiddleware")
// Create Razorpay order
router.post("/create-order", createOrder);

// Verify Razorpay payment
router.post("/verify", authMiddleware,verifyPayment);

module.exports = router;
