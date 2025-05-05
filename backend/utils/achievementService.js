// services/achievementService.js
const { Op } = require("sequelize");
const MeditationSession = require("../models/mysql/MeditationSession");
const User = require("../models/mysql/User");
const { sequelize } = require("../config/mysql");

// Define achievements
const achievements = [
  {
    id: "first_session",
    title: "First Step",
    description: "Complete your first meditation session",
    type: "session_count",
    threshold: 1,
    icon: "🌱",
  },
  {
    id: "five_sessions",
    title: "Getting Started",
    description: "Complete 5 meditation sessions",
    type: "session_count",
    threshold: 5,
    icon: "🌿",
  },
  {
    id: "twenty_sessions",
    title: "Consistent Practice",
    description: "Complete 20 meditation sessions",
    type: "session_count",
    threshold: 20,
    icon: "🌳",
  },
  {
    id: "fifty_sessions",
    title: "Dedicated Meditator",
    description: "Complete 50 meditation sessions",
    type: "session_count",
    threshold: 50,
    icon: "🏞️",
  },
  {
    id: "hundred_sessions",
    title: "Meditation Master",
    description: "Complete 100 meditation sessions",
    type: "session_count",
    threshold: 100,
    icon: "🌍",
  },
  {
    id: "streak_3",
    title: "Three-Day Streak",
    description: "Meditate for 3 consecutive days",
    type: "streak",
    threshold: 3,
    icon: "🔥",
  },
  {
    id: "streak_7",
    title: "Weekly Warrior",
    description: "Meditate for 7 consecutive days",
    type: "streak",
    threshold: 7,
    icon: "🔥🔥",
  },
  {
    id: "streak_21",
    title: "Habit Former",
    description: "Meditate for 21 consecutive days",
    type: "streak",
    threshold: 21,
    icon: "🔥🔥🔥",
  },
  {
    id: "streak_30",
    title: "Monthly Dedication",
    description: "Meditate for 30 consecutive days",
    type: "streak",
    threshold: 30,
    icon: "🏆",
  },
  {
    id: "streak_100",
    title: "Centurion",
    description: "Maintain a 100-day meditation streak",
    type: "streak",
    threshold: 100,
    icon: "👑",
  },
  {
    id: "total_time_60",
    title: "Hour of Mindfulness",
    description: "Accumulate 60 minutes of meditation",
    type: "total_time",
    threshold: 60,
    icon: "⌛",
  },
  {
    id: "total_time_300",
    title: "Five Hours of Peace",
    description: "Accumulate 300 minutes of meditation",
    type: "total_time",
    threshold: 300,
    icon: "⏳",
  },
  {
    id: "total_time_1000",
    title: "Mindfulness Milestone",
    description: "Accumulate 1,000 minutes of meditation",
    type: "total_time",
    threshold: 1000,
    icon: "🕰️",
  },
  {
    id: "total_time_3000",
    title: "Meditation Maven",
    description: "Accumulate 3,000 minutes of meditation",
    type: "total_time",
    threshold: 3000,
    icon: "🌠",
  },
  {
    id: "total_time_10000",
    title: "Meditation Sage",
    description: "Accumulate 10,000 minutes of meditation",
    type: "total_time",
    threshold: 10000,
    icon: "🧘",
  },
  {
    id: "variety_3",
    title: "Technique Explorer",
    description: "Try 3 different meditation types",
    type: "variety",
    threshold: 3,
    icon: "🔍",
  },
  {
    id: "variety_5",
    title: "Meditation Adventurer",
    description: "Try 5 different meditation types",
    type: "variety",
    threshold: 5,
    icon: "🧭",
  },
  {
    id: "variety_all",
    title: "Complete Collection",
    description: "Try all meditation types",
    type: "variety",
    threshold: 10, // This should match the number of meditation types available
    icon: "🌈",
  },
  {
    id: "long_session_15",
    title: "Deep Diver",
    description: "Complete a 15+ minute meditation session",
    type: "long_session",
    threshold: 15,
    icon: "🐋",
  },
  {
    id: "long_session_30",
    title: "Endurance Meditator",
    description: "Complete a 30+ minute meditation session",
    type: "long_session",
    threshold: 30,
    icon: "🐳",
  },
  {
    id: "long_session_60",
    title: "Meditation Marathon",
    description: "Complete a 60+ minute meditation session",
    type: "long_session",
    threshold: 60,
    icon: "🏊",
  },
];

/**
 * Gets a user's progress on all achievements
 * @param {number} userId - The user ID
 * @param {number} currentStreak - Current meditation streak
 * @param {number} totalMinutes - Total meditation minutes
 * @returns {Array} Array of achievements with completion status
 */
async function getUserAchievements(userId, currentStreak, totalMinutes) {
  // Get session count
  const sessionCount = await MeditationSession.count({
    where: { userId },
  });

  // Get distinct meditation types
  const distinctTypes = await MeditationSession.findAll({
    attributes: [
      [sequelize.fn("DISTINCT", sequelize.col("meditationType")), "type"],
    ],
    where: {
      userId,
      meditationType: {
        [Op.not]: null,
      },
    },
  });
  const varietyCount = distinctTypes.length;

  // Get longest session
  const longestSession = await MeditationSession.findOne({
    where: { userId },
    order: [["duration", "DESC"]],
    attributes: ["duration"],
  });
  const longestSessionDuration = longestSession ? longestSession.duration : 0;

  // Calculate achievement progress
  return achievements.map((achievement) => {
    let progress = 0;
    let achieved = false;
    let progressText = "";

    switch (achievement.type) {
      case "session_count":
        progress = Math.min(100, (sessionCount / achievement.threshold) * 100);
        achieved = sessionCount >= achievement.threshold;
        progressText = `${sessionCount}/${achievement.threshold} sessions`;
        break;
      case "streak":
        progress = Math.min(100, (currentStreak / achievement.threshold) * 100);
        achieved = currentStreak >= achievement.threshold;
        progressText = `${currentStreak}/${achievement.threshold} days`;
        break;
      case "total_time":
        progress = Math.min(100, (totalMinutes / achievement.threshold) * 100);
        achieved = totalMinutes >= achievement.threshold;
        progressText = `${totalMinutes}/${achievement.threshold} minutes`;
        break;
      case "variety":
        progress = Math.min(100, (varietyCount / achievement.threshold) * 100);
        achieved = varietyCount >= achievement.threshold;
        progressText = `${varietyCount}/${achievement.threshold} types`;
        break;
      case "long_session":
        progress = Math.min(
          100,
          (longestSessionDuration / achievement.threshold) * 100
        );
        achieved = longestSessionDuration >= achievement.threshold;
        progressText = `${longestSessionDuration}/${achievement.threshold} minutes`;
        break;
    }

    return {
      ...achievement,
      achieved,
      progress: Math.round(progress),
      progressText,
    };
  });
}

/**
 * Checks if a user has unlocked any new achievements
 * @param {number} userId - The user ID
 * @param {number} currentStreak - Current meditation streak
 * @param {number} totalMinutes - Total meditation minutes
 * @returns {Array} Newly unlocked achievements
 */
async function checkForAchievements(userId, currentStreak, totalMinutes) {
  // Get the achievement progress
  const achievementProgress = await getUserAchievements(
    userId,
    currentStreak,
    totalMinutes
  );

  // Get the previous achievements (before this session)
  // In a more complete implementation, this would be stored in a database
  // For simplicity, we'll recalculate with the previous values
  const previousStreak = currentStreak > 0 ? currentStreak - 1 : 0;
  const previousSessionCount =
    (await MeditationSession.count({
      where: { userId },
    })) - 1;
  const previousTotalMinutes =
    totalMinutes -
    (
      await MeditationSession.findOne({
        where: { userId },
        order: [["createdAt", "DESC"]],
        attributes: ["duration"],
      })
    ).duration;

  const previousAchievementProgress = achievements.map((achievement) => {
    let achieved = false;

    switch (achievement.type) {
      case "session_count":
        achieved = previousSessionCount >= achievement.threshold;
        break;
      case "streak":
        achieved = previousStreak >= achievement.threshold;
        break;
      case "total_time":
        achieved = previousTotalMinutes >= achievement.threshold;
        break;
      // We're ignoring variety and long_session as they can't be newly unlocked in a single session update
    }

    return {
      ...achievement,
      achieved,
    };
  });

  // Find newly unlocked achievements
  const newAchievements = achievementProgress
    .filter((a) => a.achieved)
    .filter((a) => {
      const previous = previousAchievementProgress.find((pa) => pa.id === a.id);
      return !previous.achieved;
    });

  return newAchievements;
}

/**
 * Gets user's meditation statistics
 * @param {number} userId - The user ID
 * @returns {Object} Various meditation statistics
 */
async function getUserMeditationStats(userId) {
  // Get total number of sessions
  const totalSessions = await MeditationSession.count({
    where: { userId },
  });

  // Get total meditation time (should match user.totalMinutes, but double-checking)
  const totalMinutesResult = await MeditationSession.sum("duration", {
    where: { userId },
  });
  const totalMinutes = totalMinutesResult || 0;

  // Calculate average session length
  const averageSessionLength =
    totalSessions > 0 ? totalMinutes / totalSessions : 0;

  // Get longest streak (from streak service)
  const { getLongestStreak } = require("./streakService");
  const longestStreak = await getLongestStreak(userId);

  // Get most practiced meditation type
  const typesCount = await MeditationSession.findAll({
    attributes: [
      "meditationType",
      [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      [sequelize.fn("SUM", sequelize.col("duration")), "totalDuration"],
    ],
    where: {
      userId,
      meditationType: {
        [Op.not]: null,
      },
    },
    group: ["meditationType"],
    order: [[sequelize.literal("count"), "DESC"]],
    limit: 1,
  });

  const favoriteType =
    typesCount.length > 0 ? typesCount[0].get("meditationType") : null;

  // Get longest session
  const longestSession = await MeditationSession.findOne({
    where: { userId },
    order: [["duration", "DESC"]],
    attributes: ["duration", "completedAt", "meditationType"],
  });

  // Get recent activity summary (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSessions = await MeditationSession.count({
    where: {
      userId,
      completedAt: {
        [Op.gte]: thirtyDaysAgo,
      },
    },
  });

  const recentMinutes =
    (await MeditationSession.sum("duration", {
      where: {
        userId,
        completedAt: {
          [Op.gte]: thirtyDaysAgo,
        },
      },
    })) || 0;

  // Count days meditated in the last 30 days
  const recentDates = await MeditationSession.findAll({
    attributes: [[sequelize.fn("DATE", sequelize.col("completedAt")), "date"]],
    where: {
      userId,
      completedAt: {
        [Op.gte]: thirtyDaysAgo,
      },
    },
    group: [sequelize.fn("DATE", sequelize.col("completedAt"))],
    raw: true,
  });

  const daysMeditated = recentDates.length;
  const consistencyRate = Math.round((daysMeditated / 30) * 100);

  return {
    totalSessions,
    totalMinutes,
    averageSessionLength,
    longestStreak,
    favoriteType,
    longestSession: longestSession
      ? {
          duration: longestSession.duration,
          date: longestSession.completedAt,
          type: longestSession.meditationType,
        }
      : null,
    recentSessions,
    recentMinutes,
    daysMeditated,
    consistencyRate,
  };
}

module.exports = {
  getUserAchievements,
  checkForAchievements,
  getUserMeditationStats,
};
