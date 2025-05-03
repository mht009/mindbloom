// services/streakService.js
const { Op } = require("sequelize");
const User = require("../models/mysql/User");
const MeditationSession = require("../models/mysql/MeditationSession");
const { sequelize } = require("../config/mysql");
const { getNewlyUnlockedAchievements } = require("./achievementService");

/**
 * Updates user streak based on meditation activity
 * @param {number} userId - User ID
 * @param {number} duration - Meditation session duration in minutes
 * @returns {Object} Updated user data with streak information and achievements
 */
async function updateStreak(userId, duration) {
  // Use a transaction to ensure data consistency
  const transaction = await sequelize.transaction();

  try {
    const user = await User.findByPk(userId, { transaction });

    if (!user) {
      throw new Error("User not found");
    }

    // Get date boundaries for yesterday and today (in user's local timezone if possible)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if user meditated today already
    const todaySession = await MeditationSession.findOne({
      where: {
        userId,
        completedAt: {
          [Op.gte]: today,
          [Op.lt]: tomorrow,
        },
      },
      transaction,
    });

    // Check if user meditated yesterday
    const yesterdaySession = await MeditationSession.findOne({
      where: {
        userId,
        completedAt: {
          [Op.gte]: yesterday,
          [Op.lt]: today,
        },
      },
      transaction,
    });

    // Update streak count
    if (!todaySession) {
      // This is first meditation today
      if (yesterdaySession) {
        // If user meditated yesterday, increment streak
        user.streakCount += 1;
      } else {
        // If user didn't meditate yesterday, reset streak to 1
        user.streakCount = 1;
      }
    }
    // If already meditated today, streak stays the same

    // Store previous values for achievement tracking
    const previousStreak = user.streakCount;
    const previousMinutes = user.totalMinutes;

    // Update total minutes
    user.totalMinutes += duration;

    // Save user changes
    await user.save({ transaction });

    // Check for newly unlocked achievements
    const newAchievements = getNewlyUnlockedAchievements(
      userId,
      previousStreak,
      user.streakCount,
      previousMinutes,
      user.totalMinutes
    );

    // Commit transaction
    await transaction.commit();

    return {
      streak: user.streakCount,
      totalMinutes: user.totalMinutes,
      todayCompleted: true,
      newAchievements,
    };
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    throw error;
  }
}

/**
 * Gets user's current streak information
 * @param {number} userId - User ID
 * @returns {Object} Streak information
 */
async function getStreakInfo(userId) {
  const user = await User.findByPk(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user meditated today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todaySession = await MeditationSession.findOne({
    where: {
      userId,
      completedAt: {
        [Op.gte]: today,
        [Op.lt]: tomorrow,
      },
    },
  });

  return {
    streak: user.streakCount,
    totalMinutes: user.totalMinutes,
    todayCompleted: !!todaySession,
  };
}

module.exports = {
  updateStreak,
  getStreakInfo,
};
