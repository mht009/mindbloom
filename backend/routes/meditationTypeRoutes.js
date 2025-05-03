// routes/esmeditationTypeRoutes.js
const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const meditationTypeController = require("../controllers/meditationTypeController");
const verifyToken = require("../middlewares/verifyToken");
const isAdmin = require("../middlewares/isAdmin");

// Public routes (no authentication required)
/**
 * @route GET /api/meditation-types
 * @desc Get all meditation types
 * @access Public
 */
router.get("/", meditationTypeController.getAllTypes);

/**
 * @route GET /api/meditation-types/:id
 * @desc Get meditation type by ID
 * @access Public
 */
router.get("/:id", meditationTypeController.getTypeById);

/**
 * @route GET /api/meditation-types/search
 * @desc Search meditation types
 * @access Public
 */
router.get("/search", meditationTypeController.searchTypes);

// Admin-only routes (authentication + admin role required)
// First apply authentication middleware
router.use(verifyToken);

// Then apply admin check middleware for admin-only routes
/**
 * @route POST /api/meditation-types
 * @desc Create new meditation type
 * @access Private/Admin
 */
router.post(
  "/",
  isAdmin, // Admin check middleware
  [
    check("name").notEmpty().withMessage("Name is required"),
    check("description").notEmpty().withMessage("Description is required"),
    check("howToPractice")
      .notEmpty()
      .withMessage("How to practice is required"),
    check("benefits").notEmpty().withMessage("Benefits are required"),
    check("recommendedFor")
      .notEmpty()
      .withMessage("Recommended for is required"),
    check("recommendedDuration")
      .notEmpty()
      .withMessage("Recommended duration is required"),
  ],
  meditationTypeController.createType
);

/**
 * @route PUT /api/meditation-types/:id
 * @desc Update meditation type
 * @access Private/Admin
 */
router.put(
  "/:id",
  isAdmin, // Admin check middleware
  meditationTypeController.updateType
);

/**
 * @route DELETE /api/meditation-types/:id
 * @desc Delete meditation type
 * @access Private/Admin
 */
router.delete(
  "/:id",
  isAdmin, // Admin check middleware
  meditationTypeController.deleteType
);

module.exports = router;
