// middlewares/isAdmin.js

/**
 * Middleware to check if the authenticated user has admin role
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function isAdmin(req, res, next) {
  // This middleware should be used after the authenticate middleware,
  // which sets req.user with the authenticated user's information

  // Check if user exists in request object
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  // Check if user has admin role
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  // If user is admin, proceed to the next middleware/controller
  next();
}

module.exports = isAdmin;
