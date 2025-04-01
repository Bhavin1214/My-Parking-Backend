const ParkingLocation = require("../models/ParkingLocation");

const createParkingLocation = async (req, res) => {
  try {
    // Extract necessary fields from request body
    const { name, address, latitude, longitude, slots, pricing } = req.body;
    
    // Validate required fields
    if (!name || !address || latitude === undefined || longitude === undefined || !slots || !pricing) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Create a new ParkingLocation document
    const newLocation = new ParkingLocation({
      name,
      address,
      latitude,
      longitude,
      slots,   // Expecting an object with properties for "2-wheeler" and "4-wheeler"
      pricing  // Expecting an object with pricing for "2-wheeler" and "4-wheeler"
    });

    // Save the new parking location in the database
    await newLocation.save();

    res.status(201).json({ message: "Parking location created successfully", location: newLocation });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
  };

const getAllParkingLocations = async (req, res) => {
    try {
      const locations = await ParkingLocation.find({});
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Server error while fetching parking locations." });
    }
  };
  
  const getParkingLocationById = async (req, res) => {
    try {
      const location = await ParkingLocation.findById(req.params.id);
      if (!location) {
        return res.status(404).json({ message: "Parking location not found." });
      }
      res.json(location);
    } catch (error) {
      res.status(500).json({ message: "Server error while fetching parking location." });
    }
  };
  
  const updateParkingLocation = async (req, res) => {
    try {
      const { name, address, latitude, longitude, slots, pricing } = req.body;
  
      const updatedLocation = await ParkingLocation.findByIdAndUpdate(
        req.params.id,
        { name, address, latitude, longitude, slots, pricing },
        { new: true, runValidators: true }
      );
  
      if (!updatedLocation) {
        return res.status(404).json({ message: "Parking location not found." });
      }
  
      res.json({ message: "Parking location updated successfully.", location: updatedLocation });
    } catch (error) {
      res.status(500).json({ message: "Server error while updating parking location." });
    }
  };
  
  const deleteParkingLocation = async (req, res) => {
    try {
      const deletedLocation = await ParkingLocation.findByIdAndDelete(req.params.id);
      if (!deletedLocation) {
        return res.status(404).json({ message: "Parking location not found." });
      }
      res.json({ message: "Parking location deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Server error while deleting parking location." });
    }
  };

  const searchParkingLocations = async (req, res) => {
    try {
      const { q } = req.query;
      if (!q) {
        return res.status(400).json({ message: "Query parameter 'q' is required." });
      }
      // Use regex for a case‑insensitive search on both name and address fields
      const locations = await ParkingLocation.find({
        $or: [
          { name: { $regex: q, $options: "i" } },
          { address: { $regex: q, $options: "i" } }
        ]
      });
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Error searching for parking locations", error: error.message });
    }
  };
  
  // Get nearby parking locations based on latitude and longitude
  const getNearbyParkingLocations = async (req, res) => {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ message: "Latitude and longitude are required." });
      }
      
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
  
      // Query using the GeoJSON 'location' field. Ensure your model has a 2dsphere index.
      const locations = await ParkingLocation.find({
        location: {
          $near: {
            $geometry: { type: "Point", coordinates: [longitude, latitude] },
            $maxDistance: 5000  // for example, within a 5km radius
          }
        }
      });
  
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: "Error fetching nearby parking locations", error: error.message });
    }
  };  

module.exports = { createParkingLocation,
                   getAllParkingLocations,
                   getParkingLocationById,
                   updateParkingLocation,
                   deleteParkingLocation,
                   searchParkingLocations,
                   getNearbyParkingLocations,
                };
