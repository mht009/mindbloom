// routes/meditationRoutes.js
const express = require("express");
const { check, validationResult } = require("express-validator");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const User = require("../models/mysql/User");
const MeditationSession = require("../models/mysql/MeditationSession");
const { updateStreak, getStreakInfo } = require("../services/streakService");
const {
  getUserAchievements,
  getUserMeditationStats,
} = require("../services/achievementService");
const { Op } = require("sequelize");
const { sequelize } = require("../config/mysql");

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
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { duration, meditationType, notes } = req.body;
      const { userId } = req.user;

      // Create meditation session
      const session = await MeditationSession.create({
        userId,
        duration,
        meditationType,
        notes,
        completedAt: new Date(),
      });

      console.log(Date());

      // Update user's streak and total minutes
      const streakInfo = await updateStreak(userId, duration);

      // Prepare response data
      const responseData = {
        session: {
          id: session.id,
          duration,
          completedAt: session.completedAt,
        },
        streak: streakInfo.streak,
        totalMinutes: streakInfo.totalMinutes,
        todayCompleted: streakInfo.todayCompleted,
      };

      // Add achievements if any were unlocked
      if (streakInfo.newAchievements && streakInfo.newAchievements.length > 0) {
        responseData.newAchievements = streakInfo.newAchievements;
      }

      res.status(201).json({
        success: true,
        message: "Meditation session recorded successfully",
        data: responseData,
      });
    } catch (error) {
      console.error("Error recording meditation session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to record meditation session",
        error: error.message,
      });
    }
  }
);

/**
 * @route GET /api/meditation/history
 * @desc Get user's meditation history
 * @access Private
 */
router.get("/history", async (req, res) => {
  try {
    const { userId } = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get user's meditation sessions
    const sessions = await MeditationSession.findAndCountAll({
      where: { userId },
      order: [["completedAt", "DESC"]],
      limit,
      offset,
    });

    // Get streak information
    const streakInfo = await getStreakInfo(userId);

    res.status(200).json({
      success: true,
      data: {
        sessions: sessions.rows,
        pagination: {
          total: sessions.count,
          page,
          limit,
          totalPages: Math.ceil(sessions.count / limit),
        },
        ...streakInfo,
      },
    });
  } catch (error) {
    console.error("Error getting meditation history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve meditation history",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/meditation/streak
 * @desc Get user's streak information
 * @access Private
 */
router.get("/streak", async (req, res) => {
  try {
    const { userId } = req.user;

    // Get streak information
    const streakInfo = await getStreakInfo(userId);

    res.status(200).json({
      success: true,
      data: streakInfo,
    });
  } catch (error) {
    console.error("Error getting streak information:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve streak information",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/meditation/achievements
 * @desc Get all user achievements
 * @access Private
 */
router.get("/achievements", async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user data
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all achievements with completion status
    const achievements = await getUserAchievements(
      userId,
      user.streakCount,
      user.totalMinutes
    );

    // Get meditation statistics
    const stats = await getUserMeditationStats(userId);

    res.status(200).json({
      success: true,
      data: {
        achievements,
        stats,
        currentStreak: user.streakCount,
        totalMinutes: user.totalMinutes,
      },
    });
  } catch (error) {
    console.error("Error getting achievements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve achievements",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/meditation/dashboard
 * @desc Get user's meditation dashboard data
 * @access Private
 */
router.get("/dashboard", async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user data
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get meditation statistics
    const stats = await getUserMeditationStats(userId);

    // Get all achievements with completion status
    const allAchievements = await getUserAchievements(
      userId,
      user.streakCount,
      user.totalMinutes
    );

    // First get achievements that are close to being achieved (80%+ progress but not achieved)
    const upcomingAchievements = allAchievements
      .filter((a) => !a.achieved && a.progress >= 80)
      .slice(0, 2);

    // Then get most recently achieved ones
    const recentlyAchieved = allAchievements
      .filter((a) => a.achieved)
      .slice(0, 3 - upcomingAchievements.length);

    const highlightedAchievements = [
      ...upcomingAchievements,
      ...recentlyAchieved,
    ];

    res.status(200).json({
      success: true,
      data: {
        streakCount: user.streakCount,
        totalMinutes: user.totalMinutes,
        stats,
        highlightedAchievements,
        totalAchievementsCount: allAchievements.filter((a) => a.achieved)
          .length,
        totalPossibleAchievements: allAchievements.length,
      },
    });
  } catch (error) {
    console.error("Error getting dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard data",
      error: error.message,
    });
  }
});

/**
 * @route GET /api/meditation/calendar
 * @desc Get user's meditation calendar data
 * @access Private
 */
router.get("/calendar", async (req, res) => {
  try {
    const { userId } = req.user;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month);

    // Build date filter
    const dateFilter = {};
    if (month) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter.completedAt = {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      };
    } else {
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);
      dateFilter.completedAt = {
        [Op.gte]: startDate,
        [Op.lte]: endDate,
      };
    }

    // Get meditation sessions grouped by day
    const sessions = await MeditationSession.findAll({
      attributes: [
        [sequelize.fn("DATE", sequelize.col("completedAt")), "date"],
        [sequelize.fn("SUM", sequelize.col("duration")), "duration"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        userId,
        ...dateFilter,
      },
      group: [sequelize.fn("DATE", sequelize.col("completedAt"))],
      raw: true,
    });

    // Format calendar data
    const calendarData = sessions.map((session) => ({
      date: session.date,
      duration: parseInt(session.duration),
      count: parseInt(session.count),
    }));

    res.status(200).json({
      success: true,
      data: calendarData,
    });
  } catch (error) {
    console.error("Error getting calendar data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve calendar data",
      error: error.message,
    });
  }
});

module.exports = router;
