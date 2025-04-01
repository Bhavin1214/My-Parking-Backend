const express = require("express");
const { register, 
        login,
        getProfile, 
        updateProfile,
        changePassword,
        forgotPassword,
        resetPassword,
        forgotPasswordbyemail,
        saveLocation,
        getSavedLocations,
        removeSavedLocation
       } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// Protected Route Example
router.get("/profile", authMiddleware, getProfile);
router.put("/update-profile", authMiddleware, updateProfile);
router.put("/change-password", authMiddleware, changePassword);
router.post("/forgot-password", authMiddleware, forgotPassword);
router.post("/reset-password", authMiddleware, resetPassword);
router.post("/forgot-passwordbyemail", forgotPasswordbyemail);

router.post("/save-location", authMiddleware, saveLocation);
router.get("/get-saved-locations", authMiddleware, getSavedLocations);
router.delete("/remove-saved-location/:id", authMiddleware, removeSavedLocation);

module.exports = router;