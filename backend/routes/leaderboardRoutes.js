// routes/leaderboardRoutes.js
const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const User = require("../models/mysql/User");
const MeditationSession = require("../models/mysql/MeditationSession");
const verifyToken = require("../middlewares/verifyToken");
const { asyncHandler } = require("../middlewares/asyncHandler");
const { sequelize } = require("../config/mysql");

/**
 * @route GET /api/leaderboard
 * @desc Get leaderboard by total minutes of meditation
 * @access Private
 */
router.get(
  "/",
  verifyToken,
  asyncHandler(async (req, res) => {
    // Get query parameters for pagination and timeframe
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const timeframe = req.query.timeframe || "all"; // all, month, week
    const offset = (page - 1) * limit;

    let whereCondition = {};
    let sessionWhereCondition = {};
    let includeOptions = [];

    // Add timeframe filter if needed
    if (timeframe !== "all") {
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }

      if (startDate) {
        sessionWhereCondition.completedAt = {
          [Op.gte]: startDate,
        };

        // If filtering by timeframe, we need to calculate the minutes for that period
        includeOptions = [
          {
            model: MeditationSession,
            attributes: [],
            where: sessionWhereCondition,
            required: false,
          },
        ];
      }
    }

    // Fetch users with their total minutes
    if (timeframe === "all") {
      // For all time, use the precomputed totalMinutes field
      const { count, rows: users } = await User.findAndCountAll({
        where: whereCondition,
        attributes: [
          "id",
          "name",
          "username",
          "totalMinutes",
          "streakCount",
          "createdAt",
        ],
        order: [["totalMinutes", "DESC"]],
        limit,
        offset,
      });

      // Get the current user's rank
      const { userId } = req.user;
      const currentUserRank = await getUserRank(userId, timeframe);

      // Calculate the rank for each user in the current page
      const leaderboard = users.map((user, index) => ({
        ...user.toJSON(),
        rank: offset + index + 1,
      }));

      return res.status(200).json({
        success: true,
        data: {
          leaderboard,
          currentUserRank,
          pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
          },
          timeframe,
        },
      });
    } else {
      // For specific timeframes, calculate the sum of minutes
      const leaderboardData = await User.findAll({
        attributes: [
          "id",
          "name",
          "username",
          "streakCount",
          "createdAt",
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(duration), 0)
              FROM MeditationSessions
              WHERE MeditationSessions.userId = User.id
              AND MeditationSessions.completedAt >= '${sessionWhereCondition.completedAt[
                Op.gte
              ].toISOString()}'
            )`),
            "periodMinutes",
          ],
        ],
        having: sequelize.literal("periodMinutes > 0"),
        order: [[sequelize.literal("periodMinutes"), "DESC"]],
        subQuery: false,
      });

      // Paginate the results
      const paginatedData = leaderboardData.slice(offset, offset + limit);

      // Get the current user's rank for the period
      const { userId } = req.user;
      const currentUserRank = await getUserRankForPeriod(
        userId,
        sessionWhereCondition.completedAt[Op.gte]
      );

      // Add ranks to the paginated data
      const leaderboard = paginatedData.map((user, index) => ({
        ...user.toJSON(),
        rank: offset + index + 1,
      }));

      return res.status(200).json({
        success: true,
        data: {
          leaderboard,
          currentUserRank,
          pagination: {
            total: leaderboardData.length,
            page,
            limit,
            totalPages: Math.ceil(leaderboardData.length / limit),
          },
          timeframe,
        },
      });
    }
  })
);

/**
 * @route GET /api/leaderboard/user/:userId
 * @desc Get a specific user's leaderboard position
 * @access Private
 */
router.get(
  "/user/:userId",
  verifyToken,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const timeframe = req.query.timeframe || "all";

    // Get user details
    const user = await User.findByPk(userId, {
      attributes: ["id", "name", "username", "totalMinutes", "streakCount"],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user's rank
    const rank = await getUserRank(userId, timeframe);

    // Get meditation stats for the timeframe
    let periodMinutes = user.totalMinutes;
    if (timeframe !== "all") {
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case "week":
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case "month":
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case "year":
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }

      if (startDate) {
        const result = await MeditationSession.sum("duration", {
          where: {
            userId,
            completedAt: {
              [Op.gte]: startDate,
            },
          },
        });
        periodMinutes = result || 0;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        user: {
          ...user.toJSON(),
          rank,
          periodMinutes,
        },
        timeframe,
      },
    });
  })
);

/**
 * @route GET /api/leaderboard/around-me
 * @desc Get leaderboard around the current user's position
 * @access Private
 */
router.get(
  "/around-me",
  verifyToken,
  asyncHandler(async (req, res) => {
    const { userId } = req.user;
    const timeframe = req.query.timeframe || "all";
    const range = parseInt(req.query.range) || 5; // Number of users to show above and below

    // Get current user's rank
    const userRank = await getUserRank(userId, timeframe);

    if (!userRank) {
      return res.status(200).json({
        success: true,
        data: {
          leaderboard: [],
          currentUserRank: null,
          timeframe,
        },
      });
    }

    // Calculate offset to get users around the current user
    const offset = Math.max(0, userRank.rank - range - 1);
    const limit = range * 2 + 1;

    let leaderboard;

    if (timeframe === "all") {
      const users = await User.findAll({
        attributes: ["id", "name", "username", "totalMinutes", "streakCount"],
        order: [["totalMinutes", "DESC"]],
        offset,
        limit,
      });

      leaderboard = users.map((user, index) => ({
        ...user.toJSON(),
        rank: offset + index + 1,
      }));
    } else {
      // For timeframe-specific leaderboards
      const startDate = getStartDateForTimeframe(timeframe);

      const allUsers = await User.findAll({
        attributes: [
          "id",
          "name",
          "username",
          "streakCount",
          [
            sequelize.literal(`(
              SELECT COALESCE(SUM(duration), 0)
              FROM MeditationSessions
              WHERE MeditationSessions.userId = User.id
              AND MeditationSessions.completedAt >= '${startDate.toISOString()}'
            )`),
            "periodMinutes",
          ],
        ],
        having: sequelize.literal("periodMinutes > 0"),
        order: [[sequelize.literal("periodMinutes"), "DESC"]],
        subQuery: false,
      });

      // Paginate the results
      const paginatedData = allUsers.slice(offset, offset + limit);

      leaderboard = paginatedData.map((user, index) => ({
        ...user.toJSON(),
        rank: offset + index + 1,
      }));
    }

    return res.status(200).json({
      success: true,
      data: {
        leaderboard,
        currentUserRank: userRank,
        timeframe,
      },
    });
  })
);

// Helper function to get user rank
async function getUserRank(userId, timeframe = "all") {
  let rank;
  let totalMinutes;

  if (timeframe === "all") {
    const user = await User.findByPk(userId, {
      attributes: ["totalMinutes"],
    });

    if (!user) return null;

    totalMinutes = user.totalMinutes;

    // Count users with more minutes
    const count = await User.count({
      where: {
        totalMinutes: {
          [Op.gt]: totalMinutes,
        },
      },
    });

    rank = count + 1;
  } else {
    // For specific timeframes
    const startDate = getStartDateForTimeframe(timeframe);

    // Get current user's minutes for the period
    const userMinutes = await MeditationSession.sum("duration", {
      where: {
        userId,
        completedAt: {
          [Op.gte]: startDate,
        },
      },
    });

    totalMinutes = userMinutes || 0;

    // Count users with more minutes in this period
    const result = await sequelize.query(
      `
      SELECT COUNT(DISTINCT u.id) as count
      FROM Users u
      INNER JOIN (
        SELECT userId, SUM(duration) as totalDuration
        FROM MeditationSessions
        WHERE completedAt >= ?
        GROUP BY userId
        HAVING totalDuration > ?
      ) ms ON u.id = ms.userId
    `,
      {
        replacements: [startDate, totalMinutes],
        type: sequelize.QueryTypes.SELECT,
      }
    );

    rank = result[0].count + 1;
  }

  return { rank, totalMinutes };
}

// Helper function to get user rank for a specific period
async function getUserRankForPeriod(userId, startDate) {
  // Get current user's minutes for the period
  const userMinutes = await MeditationSession.sum("duration", {
    where: {
      userId,
      completedAt: {
        [Op.gte]: startDate,
      },
    },
  });

  const totalMinutes = userMinutes || 0;

  // Count users with more minutes in this period
  const result = await sequelize.query(
    `
    SELECT COUNT(DISTINCT u.id) as count
    FROM Users u
    INNER JOIN (
      SELECT userId, SUM(duration) as totalDuration
      FROM MeditationSessions
      WHERE completedAt >= ?
      GROUP BY userId
      HAVING totalDuration > ?
    ) ms ON u.id = ms.userId
  `,
    {
      replacements: [startDate, totalMinutes],
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return { rank: result[0].count + 1, totalMinutes };
}

// Helper function to get start date for timeframe
function getStartDateForTimeframe(timeframe) {
  const now = new Date();
  let startDate;

  switch (timeframe) {
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(0); // Beginning of time
  }

  return startDate;
}

module.exports = router;
