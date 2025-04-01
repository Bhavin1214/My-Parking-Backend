const cron = require("node-cron");
const mongoose = require("mongoose");
const Booking = require("./models/Booking");
const ParkingLocation = require("./models/ParkingLocation");



const autocomplete = async()=>{ 
try {
    const expiredBookings = await Booking.find({
      status: "active", 
      endTime: { $lte: new Date() }, 
    });

    if (expiredBookings.length === 0) {
      return;
    }

    for (let booking of expiredBookings) {
      const parking = await ParkingLocation.findById(booking.parkingId);
      if (parking) {
        if (booking.vehicleType === "2-wheeler") {
          parking.slots["2-wheeler"].available += 1;
        } else if (booking.vehicleType === "4-wheeler") {
          parking.slots["4-wheeler"].available += 1;
        }
        await parking.save(); 
      }

      booking.status = "completed";
      await booking.save();
    }

  } catch (error) {
    console.error(" Error in auto-completion task:", error);
  }
}



module.exports = { autocomplete }