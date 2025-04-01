const express = require("express");
const router = express.Router();
const { createParkingLocation,
        getAllParkingLocations,
        getParkingLocationById,
        updateParkingLocation,
        deleteParkingLocation,
        searchParkingLocations,
        getNearbyParkingLocations 
       } = require("../controllers/ParkingLocationController");
const authMiddleware = require("../middleware/authMiddleware");

// For a public endpoint or testing purposes:
router.post("/createlocations", createParkingLocation);
router.get("/getlocations", getAllParkingLocations);
router.get("/getlocations/:id", getParkingLocationById);
router.put("/updatelocations/:id", updateParkingLocation);
router.delete("/deletelocations/:id", deleteParkingLocation);

router.get("/searchparking", authMiddleware, searchParkingLocations);
router.get("/nearbyparking", authMiddleware, getNearbyParkingLocations);


module.exports = router;
