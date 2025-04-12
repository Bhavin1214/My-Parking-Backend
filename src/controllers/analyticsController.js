// controllers/analyticsController.js
const Booking = require("../models/Booking");
const ParkingLocation = require("../models/ParkingLocation");

const getLocationAnalytics = async (req, res) => {
  try {
    const providerId = req.user.id;

    // Get all parking locations created by this provider
    const locations = await ParkingLocation.find({ createdBy: providerId });

    // For each location, get the booking analytics
    const analyticsData = await Promise.all(
      locations.map(async (location) => {
        // Fetch bookings for this location
        const bookings = await Booking.find({ parkingId: location._id });

        // Total bookings
        const totalBookings = bookings.length;

        // Confirmed bookings: active or completed
        const confirmedBookings = bookings.filter((b) =>
          b.status === "active" || b.status === "completed"
        ).length;

        // Cancelled bookings
        const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;

        // Total earnings from non-cancelled bookings
        const totalEarnings = bookings.reduce((sum, booking) => {
          if (booking.status !== "cancelled") {
            return sum + booking.pricePaid;
          }
          return sum;
        }, 0);

        return {
          locationId: location._id,
          locationName: location.name,
          totalBookings,
          confirmedBookings,
          cancelledBookings,
          totalEarnings,
        };
      })
    );

    res.json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Error fetching analytics", error: error.message });
  }
};

module.exports = { getLocationAnalytics };
