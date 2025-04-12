require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./src/routes/authRoutes");
const parkingLocationRoutes = require("./src/routes/ParkingLocationRoute");
const bookingRoutes = require("./src/routes/BookingRoute");
const razorpayroute = require("./src/routes/razorpayRoute")
const analyticsroute = require("./src/routes/analyticsRoutes")
const transactionroute = require("./src/routes/transactionroutes")
const { autocomplete } = require("./src/Cornjobs")

const app = express();

// Middleware setup
app.use(express.json());
app.use(cors());


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/parkingLocations", parkingLocationRoutes);
app.use("/api/bookings",bookingRoutes)
app.use("/api/payments",razorpayroute)
app.use("/api",analyticsroute)
app.use("/api/transactions",transactionroute)

setInterval(() => {
  autocomplete()
}, 300000);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB Connected ✅"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
