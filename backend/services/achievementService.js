// services/achievementService.js
const MeditationSession = require("../models/mysql/MeditationSession");
const { Op } = require("sequelize");

// Define achievement milestones
const streakMilestones = [
  {
    days: 1,
    name: "First Step",
    description: "Completed your first meditation",
  },
  {
    days: 3,
    name: "Budding Practice",
    description: "Meditated for 3 days in a row",
  },
  {
    days: 7,
    name: "Weekly Warrior",
    description: "Maintained a 7-day meditation streak",
  },
  {
    days: 14,
    name: "Fortnight Focus",
    description: "Maintained a 14-day meditation streak",
  },
  {
    days: 21,
    name: "Habit Formed",
    description: "21 days of consistent meditation",
  },
  {
    days: 30,
    name: "Monthly Master",
    description: "Completed a month of daily meditation",
  },
  {
    days: 60,
    name: "Disciplined Mind",
    description: "2 months of continuous practice",
  },
  {
    days: 90,
    name: "Quarterly Commitment",
    description: "3 months of dedicated practice",
  },
  {
    days: 180,
    name: "Meditation Sage",
    description: "6 months of unwavering dedication",
  },
  {
    days: 365,
    name: "Zen Master",
    description: "A full year of daily meditation",
  },
];

const minuteMilestones = [
  {
    minutes: 60,
    name: "Hour Marker",
    description: "Accumulated 1 hour of meditation",
  },
  {
    minutes: 300,
    name: "5-Hour Focus",
    description: "Accumulated 5 hours of meditation",
  },
  {
    minutes: 600,
    name: "10-Hour Journey",
    description: "Accumulated 10 hours of meditation",
  },
  {
    minutes: 1500,
    name: "25-Hour Devotion",
    description: "Accumulated 25 hours of meditation",
  },
  {
    minutes: 3000,
    name: "50-Hour Milestone",
    description: "Accumulated 50 hours of meditation",
  },
  {
    minutes: 6000,
    name: "100-Hour Achievement",
    description: "Accumulated 100 hours of meditation",
  },
  {
    minutes: 18000,
    name: "300-Hour Mastery",
    description: "Accumulated 300 hours of meditation",
  },
  {
    minutes: 36000,
    name: "600-Hour Enlightenment",
    description: "Accumulated 600 hours of meditation",
  },
];

/**
 * Gets all achievements for a user
 * @param {number} userId - User ID
 * @param {number} currentStreak - Current streak count
 * @param {number} totalMinutes - Total meditation minutes
 * @returns {Object[]} Array of achievements with completion status
 */
function getUserAchievements(userId, currentStreak, totalMinutes) {
  // Process streak achievements
  const streakAchievements = streakMilestones.map((milestone) => ({
    ...milestone,
    type: "streak",
    achieved: currentStreak >= milestone.days,
    progress: Math.min(100, Math.round((currentStreak / milestone.days) * 100)),
  }));

  // Process minute achievements
  const minuteAchievements = minuteMilestones.map((milestone) => ({
    ...milestone,
    type: "minutes",
    achieved: totalMinutes >= milestone.minutes,
    progress: Math.min(
      100,
      Math.round((totalMinutes / milestone.minutes) * 100)
    ),
  }));

  // Combine all achievements
  return [...streakAchievements, ...minuteAchievements].sort((a, b) => {
    // Sort by achieved first, then by progress
    if (a.achieved !== b.achieved) {
      return a.achieved ? -1 : 1;
    }
    return b.progress - a.progress;
  });
}

/**
 * Gets newly unlocked achievements based on previous and current stats
 * @param {number} userId - User ID
 * @param {number} previousStreak - Previous streak count
 * @param {number} currentStreak - Current streak count
 * @param {number} previousMinutes - Previous total minutes
 * @param {number} currentMinutes - Current total minutes
 * @returns {Object[]} Array of newly unlocked achievements
 */
function getNewlyUnlockedAchievements(
  userId,
  previousStreak,
  currentStreak,
  previousMinutes,
  currentMinutes
) {
  const newStreakAchievements = streakMilestones
    .filter(
      (milestone) =>
        previousStreak < milestone.days && currentStreak >= milestone.days
    )
    .map((milestone) => ({
      ...milestone,
      type: "streak",
    }));

  const newMinuteAchievements = minuteMilestones
    .filter(
      (milestone) =>
        previousMinutes < milestone.minutes &&
        currentMinutes >= milestone.minutes
    )
    .map((milestone) => ({
      ...milestone,
      type: "minutes",
    }));

  return [...newStreakAchievements, ...newMinuteAchievements];
}

/**
 * Gets statistics about user's meditation practice
 * @param {number} userId - User ID
 * @returns {Object} Meditation statistics
 */
async function getUserMeditationStats(userId) {
  // Get all sessions for this user
  const sessions = await MeditationSession.findAll({
    where: { userId },
    attributes: ["duration", "completedAt", "meditationType"],
    order: [["completedAt", "DESC"]],
  });

  if (!sessions.length) {
    return {
      totalSessions: 0,
      totalMinutes: 0,
      averageSessionLength: 0,
      longestSession: 0,
      mostFrequentType: null,
      lastMeditationDate: null,
    };
  }

  // Calculate statistics
  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce(
    (sum, session) => sum + session.duration,
    0
  );
  const averageSessionLength = Math.round(totalMinutes / totalSessions);
  const longestSession = Math.max(
    ...sessions.map((session) => session.duration)
  );
  const lastMeditationDate = sessions[0].completedAt;

  // Calculate most frequent type
  const typeCounts = {};
  sessions.forEach((session) => {
    const type = session.meditationType || "unspecified";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  });

  let mostFrequentType = null;
  let maxCount = 0;

  for (const [type, count] of Object.entries(typeCounts)) {
    if (count > maxCount) {
      mostFrequentType = type;
      maxCount = count;
    }
  }

  return {
    totalSessions,
    totalMinutes,
    averageSessionLength,
    longestSession,
    mostFrequentType,
    lastMeditationDate,
  };
}

module.exports = {
  getUserAchievements,
  getNewlyUnlockedAchievements,
  getUserMeditationStats,
};
