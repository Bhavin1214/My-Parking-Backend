const Razorpay = require("razorpay");

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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: "Missing payment details" });
  }

  // Validate the payment signature sent by Razorpay
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const generated_signature = hmac.digest("hex");

  // If the signatures match, payment is valid
  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ message: "Payment signature mismatch" });
  }

  try {
    // Proceed with your business logic here (e.g., save payment details, mark booking as paid, etc.)
    // You can create a booking in the database or perform any other required actions.

    res.json({ message: "Payment verification successful!" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ message: "Error verifying payment" });
  }
};
