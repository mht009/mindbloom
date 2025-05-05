// utils/streakService.js
const { Op } = require("sequelize");
const User = require("../models/mysql/User");
const MeditationSession = require("../models/mysql/MeditationSession");
const { checkForAchievements } = require("./achievementService");

/**
 * Updates a user's meditation streak and total minutes
 * @param {number} userId - The user ID
 * @param {number} duration - Meditation duration in minutes
 * @returns {Object} Updated streak information and any new achievements
 */
async function updateStreak(userId, duration) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  console.log("Starting streak update for userId:", userId);

  // Get the current date without time (at midnight)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Log the date for debugging
  console.log("Today's date for streak calculation:", today);

  // Get yesterday's date (at midnight)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  console.log("Yesterday's date for streak calculation:", yesterday);

  // Check if user already meditated today
  const todaySession = await MeditationSession.findOne({
    where: {
      userId,
      completedAt: {
        [Op.gte]: today,
      },
    },
  });

  const todayCompleted = !!todaySession;
  console.log("User already meditated today:", todayCompleted);

  // Check if user meditated yesterday
  const yesterdaySession = await MeditationSession.findOne({
    where: {
      userId,
      completedAt: {
        [Op.gte]: yesterday,
        [Op.lt]: today,
      },
    },
  });

  console.log("User meditated yesterday:", !!yesterdaySession);

  let streakCount = user.streakCount;
  console.log("Current streak before update:", streakCount);

  // Only increment streak if not already counted for today
  if (!todayCompleted) {
    if (yesterdaySession) {
      // If user meditated yesterday, increment streak
      streakCount++;
      console.log("Continuing streak. New value:", streakCount);
    } else {
      // If user didn't meditate yesterday, reset streak to 1
      streakCount = 1;
      console.log("Break in streak or first session. Setting to 1");
    }
  } else {
    console.log("Already meditated today, streak unchanged:", streakCount);
  }

  // Update total minutes
  const totalMinutes = user.totalMinutes + duration;
  console.log(
    "Total minutes before:",
    user.totalMinutes,
    "adding:",
    duration,
    "new total:",
    totalMinutes
  );

  // Update user stats - EXPLICITLY include both streakCount and totalMinutes
  try {
    await user.update({
      streakCount: streakCount, // Explicitly include streakCount
      totalMinutes: totalMinutes,
    });

    // Verify the update
    const updatedUser = await User.findByPk(userId);
    console.log(
      "User after update - streak:",
      updatedUser.streakCount,
      "minutes:",
      updatedUser.totalMinutes
    );

    if (updatedUser.streakCount !== streakCount) {
      console.error(
        "STREAK UPDATE FAILED! Database streak value doesn't match expected value."
      );
      console.error(
        "Expected:",
        streakCount,
        "Actual:",
        updatedUser.streakCount
      );
    }
  } catch (error) {
    console.error("Error updating user stats:", error);
    throw error;
  }

  // Check for newly unlocked achievements
  const newAchievements = await checkForAchievements(
    userId,
    streakCount,
    totalMinutes
  );

  return {
    streak: streakCount,
    totalMinutes,
    todayCompleted: true,
    newAchievements,
  };
}

/**
 * Gets a user's streak information
 * @param {number} userId - The user ID
 * @returns {Object} Streak information including current streak and total minutes
 */
async function getStreakInfo(userId) {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Get the current date without time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if user already meditated today
  const todaySession = await MeditationSession.findOne({
    where: {
      userId,
      completedAt: {
        [Op.gte]: today,
      },
    },
  });

  // Get the longest streak
  const longestStreak = await getLongestStreak(userId);

  return {
    streak: user.streakCount,
    totalMinutes: user.totalMinutes,
    todayCompleted: !!todaySession,
    longestStreak,
  };
}

/**
 * Calculates a user's longest streak
 * @param {number} userId - The user ID
 * @returns {number} The longest streak in days
 */
async function getLongestStreak(userId) {
  // Get all user sessions ordered by date
  const sessions = await MeditationSession.findAll({
    where: { userId },
    order: [["completedAt", "ASC"]],
    attributes: ["completedAt"],
  });

  if (sessions.length === 0) {
    return 0;
  }

  const sessionDates = sessions.map((session) => {
    const date = new Date(session.completedAt);
    date.setHours(0, 0, 0, 0);
    return date.getTime(); // Convert to timestamp for easier comparison
  });

  // Remove duplicate dates (sessions on the same day)
  const uniqueDates = [...new Set(sessionDates)].sort((a, b) => a - b);

  let currentStreak = 1;
  let longestStreak = 1;
  const ONE_DAY = 24 * 60 * 60 * 1000; // milliseconds in a day

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = uniqueDates[i - 1];
    const currDate = uniqueDates[i];

    // Check if dates are consecutive
    if (currDate - prevDate === ONE_DAY) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * Resets streaks for all users who didn't meditate yesterday
 * Can be run daily as a cron job
 */
async function resetInactiveStreaks() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  console.log("Running daily streak reset check");
  console.log("Today:", today);
  console.log("Yesterday:", yesterday);

  // Get all users with active streaks
  const users = await User.findAll({
    where: {
      streakCount: {
        [Op.gt]: 0,
      },
    },
  });

  console.log(`Found ${users.length} users with active streaks`);

  for (const user of users) {
    // Check if user meditated yesterday
    const yesterdaySession = await MeditationSession.findOne({
      where: {
        userId: user.id,
        completedAt: {
          [Op.gte]: yesterday,
          [Op.lt]: today,
        },
      },
    });

    // If user didn't meditate yesterday, reset streak
    if (!yesterdaySession) {
      console.log(
        `User ${user.id} did not meditate yesterday, resetting streak from ${user.streakCount} to 0`
      );
      await user.update({ streakCount: 0 });
    } else {
      console.log(
        `User ${user.id} meditated yesterday, maintaining streak of ${user.streakCount}`
      );
    }
  }

  console.log("Daily streak reset complete");
}

module.exports = {
  updateStreak,
  getStreakInfo,
  getLongestStreak,
  resetInactiveStreaks,
};
