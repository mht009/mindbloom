// routes/meditationRoutes.js
const express = require("express");
const { check } = require("express-validator");
const router = express.Router();
const meditationController = require("../controllers/meditationController");
const achievementController = require("../controllers/achievementController");
const verifyToken = require("../middlewares/verifyToken");

// Apply authentication middleware to all meditation routes
router.use(verifyToken);

/**
 * @route POST /api/meditation/session
 * @desc Record a new meditation session
 * @access Private
 */
router.post(
  "/session",
  [
    check("duration")
      .isInt({ min: 1 })
      .withMessage("Duration must be a positive integer (minutes)"),
    check("meditationType").optional().isString(),
    check("notes").optional().isString(),
  ],
  meditationController.recordSession
);

/**
 * @route GET /api/meditation/history
 * @desc Get user's meditation history
 * @access Private
 */
router.get("/history", meditationController.getMeditationHistory);

/**
 * @route GET /api/meditation/streak
 * @desc Get user's streak information
 * @access Private
 */
router.get("/streak", meditationController.getStreak);

/**
 * @route GET /api/meditation/achievements
 * @desc Get all user achievements
 * @access Private
 */
router.get("/achievements", achievementController.getAchievements);

/**
 * @route GET /api/meditation/dashboard
 * @desc Get user's meditation dashboard data
 * @access Private
 */
router.get("/dashboard", achievementController.getDashboardData);

module.exports = router;
