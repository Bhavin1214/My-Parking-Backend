const { default: mongoose } = require("mongoose");
const Booking = require("../models/Booking");
const ParkingLocation = require("../models/ParkingLocation");

// Create Booking
const createBooking = async (req, res) => {
  try {
    const { parkingId, vehicleType, vehicleNumber, startTime, endTime } = req.body;
    const userId = req.user.id; // Assumes authMiddleware sets req.user

    // Validate required fields
    if (!parkingId || !vehicleType || !vehicleNumber || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required booking details." });
    }

    // Find the parking location and check availability for the chosen vehicle type
    const parking = await ParkingLocation.findById(parkingId);
    if (!parking) {
      return res.status(404).json({ message: "Parking location not found." });
    }

    // Check availability based on vehicle type
    if (vehicleType === "2-wheeler") {
      if (parking.slots["2-wheeler"].available < 1) {
        return res.status(400).json({ message: "No available 2-wheeler slots." });
      }
      parking.slots["2-wheeler"].available -= 1;
    } else if (vehicleType === "4-wheeler") {
      if (parking.slots["4-wheeler"].available < 1) {
        return res.status(400).json({ message: "No available 4-wheeler slots." });
      }
      parking.slots["4-wheeler"].available -= 1;
    } else {
      return res.status(400).json({ message: "Invalid vehicle type." });
    }

    // Calculate pricePaid based on duration and hourly rate (for simplicity, round hours)
    const durationHours = Math.ceil((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60));
    const hourlyRate = parking.pricing[vehicleType] || 0;
    const pricePaid = durationHours * hourlyRate;

    // Create booking document with the vehicle number included
    const newBooking = new Booking({
      userId,
      parkingId,
      vehicleType,
      vehicleNumber, // New field
      startTime,
      endTime,
      pricePaid,
      status: "active",
    });

    // Save booking and update parking location
    await newBooking.save();
    await parking.save();

    res.status(201).json({ message: "Booking created successfully.", booking: newBooking });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Error creating booking", error: error.message });
  }
};

// Get Bookings for a user
const getBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await Booking.find({ userId }).populate("parkingId");
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
};

// Cancel Booking
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    // Find booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // Check if booking belongs to user
    if (booking.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized: Booking does not belong to you." });
    }

    // Check if booking is still active (or if it has started)
    const now = new Date();
    if (new Date(booking.startTime) <= now) {
      return res.status(400).json({ message: "Cannot cancel booking that has already started or completed." });
    }

    // Mark booking as cancelled
    booking.status = "cancelled";
    await booking.save();

    // Increase availability in parking location
    const parking = await ParkingLocation.findById(booking.parkingId);
    if (parking) {
      if (booking.vehicleType === "2-wheeler") {
        parking.slots["2-wheeler"].available += 1;
      } else if (booking.vehicleType === "4-wheeler") {
        parking.slots["4-wheeler"].available += 1;
      }
      await parking.save();
    }

    res.json({ message: "Booking cancelled successfully.", booking });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ message: "Error cancelling booking", error: error.message });
  }
};

const completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // console.log("[MANUAL] Received Booking ID:", bookingId);

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking ID format." });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    // console.log("[MANUAL] Booking found:", booking);

    if (booking.status !== "active") {
      return res.status(400).json({ message: "Booking is not active or already completed." });
    }

    // Ensure the current time is after the end time
    if (new Date() < new Date(booking.endTime)) {
      return res.status(400).json({ message: "Booking cannot be completed before its end time." });
    }

    const parking = await ParkingLocation.findById(booking.parkingId);
    if (!parking) {
      return res.status(404).json({ message: "Parking location not found." });
    }

    // console.log("[MANUAL] Parking location found:", parking);

    if (booking.vehicleType === "2-wheeler") {
      parking.slots["2-wheeler"].available += 1;
    } else if (booking.vehicleType === "4-wheeler") {
      parking.slots["4-wheeler"].available += 1;
    }

    booking.status = "completed";

    await booking.save();
    await parking.save();

    // console.log("[MANUAL] Booking completed successfully.");
    res.status(200).json({ message: "Booking completed successfully.", booking });
  } catch (error) {
    // console.error("[MANUAL] Error completing booking:", error);
    res.status(500).json({ message: "Error completing booking", error: error.message });
  }
};

const getProviderCurrentBookings = async (req, res) => {
  try {
    const providerId = req.user.id;

    // Get parking locations created by the provider
    const providerLocations = await ParkingLocation.find({ createdBy: providerId }).select('_id');
    const locationIds = providerLocations.map(loc => loc._id);

    // Find active bookings for those locations
    const bookings = await Booking.find({
      parkingId: { $in: locationIds },
      status: "active",
    }).populate("userId", "name email")
      .populate("parkingId", "name address");

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching provider's current bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings", error: error.message });
  }
};

const getProviderBookingHistory = async (req, res) => {
  try {
    const providerId = req.user.id;

    // Fetch only parking locations created by this provider
    const providerLocations = await ParkingLocation.find({ createdBy: providerId }).select('_id');

    const locationIds = providerLocations.map(loc => loc._id);

    // Find bookings with status other than "active"
    const bookings = await Booking.find({
      parkingId: { $in: locationIds },
      status: { $ne: "active" }
    }).populate("parkingId userId");

    res.json(bookings);
  } catch (error) {
    console.error("Error fetching booking history:", error);
    res.status(500).json({ message: "Failed to fetch booking history", error: error.message });
  }
};

module.exports = { createBooking, getBookings, cancelBooking ,completeBooking, getProviderCurrentBookings, getProviderBookingHistory };
