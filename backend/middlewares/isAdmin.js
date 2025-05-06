// backend/middlewares/isAdmin.js
const User = require("../models/mysql/User");

const isAdmin = async (req, res, next) => {
  try {
    // Get user ID from the JWT verification middleware
    const userId = req.user.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Find user in database
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has admin role
    if (user.role !== "admin") {
      return res.status(403).json({ 
        message: "Access denied. Admin privileges required" 
      });
    }

    // If user is admin, proceed
    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    res.status(500).json({ message: "Server error during admin authorization" });
  }
};

module.exports = isAdmin;