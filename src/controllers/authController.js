const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../util/sendMail");


const register = async (req, res) => {
  try {
    const { name, email, password, phone, age, gender, role } = req.body;

   
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

   
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

   
    user = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      age,
      gender,
      role: role || undefined, 
    });

    await user.save();

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ message: "Register success", token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", err: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ message: "Login success", token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error", err: error.message });
  }
};


const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // Exclude password field
    
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    // Extract required fields from request body
    const { name, email, phone, gender } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      return res.status(400).json({ message: "Name, email, and phone are required." });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, email, phone, gender }, // Removed age
      { new: true, runValidators: true }
    ).select("-password"); // Exclude password field

    // If user not found
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send response
    res.json({ message: "Profile updated successfully!", user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    // Validate required fields
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match." });
    }

    // Find user by ID
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Save updated user
    await user.save();

    res.json({ message: "Password changed successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    // const userId = req.user.id; // Extracted from token (auth middleware)
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a JWT reset token valid for 10 minutes
    const resetToken = jwt.sign({ id: user._id,role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    // Construct reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email message
    const message = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank"><button>reset password</button></a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      html: message,
    });

    res.json({ message: "Password reset link sent to your email." });

  } catch (error) {
    res.status(500).json({ message: "Server error. Try again later." });
  }
};

const forgotPasswordbyemail = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a JWT reset token valid for 10 minutes
    const resetToken = jwt.sign({ id: user._id,role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    // Construct reset link
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Email message
    const message = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" target="_blank"><button>reset password</button></a>
      <p>This link will expire in 10 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // Send email
    await sendEmail({
      to: email,
      subject: "Password Reset Request",
      html: message,
    });

    res.json({ message: "Password reset link sent to your email." });

  } catch (error) {
    res.status(500).json({ message: "Server error. Try again later." });
  }
} 

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token." });
  }
};

const saveLocation = async (req, res) => {
  try {
    console.log("Request received:", req.body, req.user); // Debug log

    const { parkingId } = req.body;
    if (!parkingId) {
      return res.status(400).json({ message: "Parking ID is required." });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Ensure savedLocations exists and is an array
    if (!Array.isArray(user.savedLocations)) {
      user.savedLocations = [];
    }

    // Convert IDs to string before checking duplicates
    if (user.savedLocations.map(String).includes(String(parkingId))) {
      return res.status(400).json({ message: "Location already saved." });
    }

    user.savedLocations.push(parkingId);
    await user.save();

    res.status(201).json({ message: "Location saved successfully." });
  } catch (error) {
    console.error("Error in saveLocation:", error);
    res.status(500).json({ message: "Error saving location.", error: error.message });
  }
};


const getSavedLocations = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('savedLocations');
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json(user.savedLocations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching saved locations.", error: error.message });
  }
};

const removeSavedLocation = async (req, res) => {
  try {
    const userId = req.user.id; // Assumes authMiddleware sets req.user
    const { id } = req.params; // The saved location ID to remove

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Filter out the location ID from the savedLocations array
    user.savedLocations = user.savedLocations.filter(
      (locId) => locId.toString() !== id
    );
    await user.save();

    res.json({ message: "Saved location removed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error removing saved location", error: error.message });
  }
};

module.exports = { register, 
                   login, 
                   getProfile, 
                   updateProfile,
                   changePassword, 
                   forgotPassword, 
                   resetPassword, 
                   forgotPasswordbyemail,
                    saveLocation ,
                    getSavedLocations,
                    removeSavedLocation
                  };
