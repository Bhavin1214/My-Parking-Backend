const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
  },
  savedLocations: [{
     type: mongoose.Schema.Types.ObjectId, 
     ref: 'ParkingLocation'
  }]
},{timestamps:true});

module.exports = mongoose.model("User", UserSchema);
