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
const {checkRole} = require("../middleware/RoleMiddleware")

// For a public endpoint or testing purposes:
router.post("/createlocations", authMiddleware, checkRole("provider"), createParkingLocation);
router.put("/updatelocations/:id",authMiddleware, checkRole("provider"), updateParkingLocation);
router.delete("/deletelocations/:id",authMiddleware, checkRole("provider"), deleteParkingLocation);

router.get("/getlocations/:id",authMiddleware, getParkingLocationById);
router.get("/getlocations",authMiddleware, getAllParkingLocations);

router.get("/searchparking", authMiddleware, searchParkingLocations);
router.get("/nearbyparking", authMiddleware, getNearbyParkingLocations);


module.exports = router;
