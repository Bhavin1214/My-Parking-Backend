const ParkingLocation = require("../models/ParkingLocation");

const createParkingLocation = async (req, res) => {
  try {
    const { name, address, location, slots, pricing } = req.body;

    if (
      !name ||
      !address ||
      !location ||
      !Array.isArray(location.coordinates) ||
      location.coordinates.length !== 2 ||
      !slots ||
      !pricing
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const newLocation = new ParkingLocation({
      name,
      address,
      location,
      slots,
      pricing,
      createdBy: req.user.id
    });

    await newLocation.save();

    res.status(201).json({
      message: "Parking location created successfully",
      location: newLocation,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const getAllParkingLocations = async (req, res) => {
  try {
    let query = {};

    // If user is a provider, show only their own parking locations
    if (req.user.role === "provider") {
      query.createdBy = req.user.id;
    }

    const locations = await ParkingLocation.find(query);
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
      const { name, address, location, pricing, slots } = req.body;  // Changed to match the structure sent from frontend
    
      // Find location by ID
      const locationData = await ParkingLocation.findById(req.params.id);
      if (!locationData) {
        return res.status(404).json({ message: "Parking location not found." });
      }
  
      // Only allow the creator (provider) to update
      if (req.user.role === "provider" && locationData.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied. You can only update your own locations." });
      }
  
      // Update fields
      locationData.name = name || locationData.name;
      locationData.address = address || locationData.address;
      locationData.location = location || locationData.location;  // Handles location (coordinates)
      
      // Update pricing and slots (this handles the nested objects)
      locationData.pricing = pricing || locationData.pricing;
      locationData.slots = slots || locationData.slots;
  
      // Save the updated location
      const updatedLocation = await locationData.save();
  
      res.json({
        message: "Parking location updated successfully.",
        location: updatedLocation
      });
    } catch (error) {
      console.error("Error updating parking location:", error);  // Added error logging for better debugging
      res.status(500).json({
        message: "Server error while updating parking location.",
        error: error.message
      });
    }
  };
  
  const deleteParkingLocation = async (req, res) => {
    try {
      const location = await ParkingLocation.findById(req.params.id);
  
      if (!location) {
        return res.status(404).json({ message: "Parking location not found." });
      }
  
      // Allow only the creator (provider) or an admin (optional) to delete
      if (req.user.role === "provider" && location.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: "Access denied. You can only delete your own locations." });
      }
  
      await location.deleteOne();
  
      res.json({ message: "Parking location deleted successfully." });
    } catch (error) {
      res.status(500).json({ message: "Server error while deleting parking location.", error: error.message });
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

module.exports = { 
                   createParkingLocation,
                   getAllParkingLocations,
                   getParkingLocationById,
                   updateParkingLocation,
                   deleteParkingLocation,
                   searchParkingLocations,
                   getNearbyParkingLocations,
                };
