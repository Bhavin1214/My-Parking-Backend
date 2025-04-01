const express = require("express");
const { createBooking, getBookings, cancelBooking, completeBooking } = require("../controllers/BookingController");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

// Create a new booking (protected)
router.post("/book-parking", authMiddleware, createBooking);

// Get all bookings for the logged-in user (protected)
router.get("/getbookings", authMiddleware, getBookings);

// Cancel a booking (protected)
router.delete("/cancle-bookings/:id", authMiddleware, cancelBooking);


router.put("/bookings/:bookingId/complete", completeBooking);


module.exports = router;
