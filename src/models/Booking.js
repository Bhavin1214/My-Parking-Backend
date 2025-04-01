const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    parkingId: { type: mongoose.Schema.Types.ObjectId, ref: "ParkingLocation", required: true },
    vehicleType: { type: String, enum: ["2-wheeler", "4-wheeler"], required: true },
    vehicleNumber: { type: String, required: true }, // New field for vehicle number
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    pricePaid: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", BookingSchema);
