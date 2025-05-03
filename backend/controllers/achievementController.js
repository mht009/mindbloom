// controllers/achievementController.js
const User = require("../models/mysql/User");
const {
  getUserAchievements,
  getNewlyUnlockedAchievements,
  getUserMeditationStats,
} = require("../services/achievementService");

/**
 * Get all user achievements
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getAchievements(req, res, next) {
  try {
    const { userId } = req.user; // Assuming authentication middleware sets req.user

    // Get user data
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get all achievements with completion status
    const achievements = getUserAchievements(
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
    next(error);
  }
}

/**
 * Gets a user's meditation dashboard data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
async function getDashboardData(req, res, next) {
  try {
    const { userId } = req.user; // Assuming authentication middleware sets req.user

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

    // Get top achievements (3 most relevant ones)
    const allAchievements = getUserAchievements(
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
    next(error);
  }
}

module.exports = {
  getAchievements,
  getDashboardData,
};
