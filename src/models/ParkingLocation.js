// models/ParkingLocation.js

const mongoose = require("mongoose");

const ParkingLocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  slots: {
    "2-wheeler": {
      total: { type: Number, required: true },
      available: { type: Number, required: true }
    },
    "4-wheeler": {
      total: { type: Number, required: true },
      available: { type: Number, required: true }
    }
  },
  pricing: {
    "2-wheeler": { type: Number, required: true },
    "4-wheeler": { type: Number, required: true }
  }
}, { timestamps: true });

ParkingLocationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("ParkingLocation", ParkingLocationSchema);
