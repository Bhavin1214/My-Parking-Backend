const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    razorpay_order_id: { type: String, required: true },
    razorpay_payment_id: { type: String },
    razorpay_signature: { type: String },
    status: {
      type: String,
      enum: ["success", "failed"],
      required: true,
    },
    paidamount:{type:Number , required:true},
    reason: { type: String }, // Only for failures
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
