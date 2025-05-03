// controllers/meditationController.js
const MeditationSession = require("../models/mysql/MeditationSession");
const { updateStreak, getStreakInfo } = require("../services/streakService");
const { validationResult } = require("express-validator");

/**
 * Record a new meditation session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function recordSession(req, res, next) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { duration, meditationType, notes } = req.body;
    const { userId } = req.user; // Assuming authentication middleware sets req.user

    // Create meditation session
    const session = await MeditationSession.create({
      userId,
      duration,
      meditationType,
      notes,
      completedAt: new Date(),
    });

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
    next(error);
  }
}

/**
 * Get user's meditation history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getMeditationHistory(req, res, next) {
  try {
    const { userId } = req.user; // Assuming authentication middleware sets req.user
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
    next(error);
  }
}

/**
 * Get user's streak information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getStreak(req, res, next) {
  try {
    const { userId } = req.user; // Assuming authentication middleware sets req.user

    // Get streak information
    const streakInfo = await getStreakInfo(userId);

    res.status(200).json({
      success: true,
      data: streakInfo,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  recordSession,
  getMeditationHistory,
  getStreak,
};
