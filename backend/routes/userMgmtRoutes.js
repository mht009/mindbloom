const express = require("express");
const { sequelize } = require("../config/mysql");
const { Op } = require("sequelize");
const esClient = require("../config/esClient");
const redisClient = require("../config/redisClient");
const verifyToken = require("../middlewares/verifyToken");
const isAdmin = require("../middlewares/isAdmin");
const User = require("../models/mysql/User");
const router = express.Router();

// Helper function to sync user to Elasticsearch
async function syncUserToElasticsearch(user) {
  try {
    const userDocument = {
      userId: user.id.toString(),
      username: user.username,
      displayName: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    await esClient.index({
      index: "users",
      id: user.id.toString(),
      body: userDocument,
      refresh: true,
    });

    console.log(`User ${user.id} synchronized to Elasticsearch`);
  } catch (error) {
    console.error(`Error syncing user ${user.id} to Elasticsearch:`, error);
    throw error;
  }
}

// List all users
router.get("/users", [verifyToken, isAdmin], async (req, res) => {
  try {
    // Get query parameters for pagination
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    // Use Sequelize to query MySQL
    const result = await User.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
      attributes: { exclude: ["password"] }, // Exclude sensitive data
    });

    res.status(200).json({
      users: result.rows,
      metadata: {
        total: result.count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error("Error listing users:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Failed to retrieve users" });
  }
});

// Change user role
router.put("/users/:id/role", [verifyToken, isAdmin], async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  const adminId = req.user.userId;

  // Validate role
  if (!role || !["user", "admin"].includes(role)) {
    return res.status(400).json({
      message: "Invalid role. Role must be either 'user' or 'admin'",
    });
  }

  // Prevent admin from changing their own role
  if (id === adminId) {
    return res.status(403).json({
      message: "You cannot change your own role",
    });
  }

  try {
    // Begin transaction
    const t = await sequelize.transaction();

    try {
      // Find and update user in MySQL
      const user = await User.findByPk(id);

      if (!user) {
        await t.rollback();
        return res.status(404).json({ message: "User not found" });
      }

      // Update role in MySQL
      user.role = role;
      await user.save({ transaction: t });

      // Update user in Elasticsearch
      await esClient.update({
        index: "users",
        id: id.toString(),
        body: {
          doc: {
            role,
            updatedAt: new Date().toISOString(),
          },
        },
        refresh: true,
      });

      // Commit transaction
      await t.commit();

      console.log(
        `Admin action: User ${id} role changed to ${role} by admin ${adminId}`
      );

      res.status(200).json({
        message: `User role updated to '${role}' successfully`,
        metadata: {
          userId: id,
          newRole: role,
          changedBy: adminId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Rollback transaction on error
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error updating user role:", {
      message: error.message,
      stack: error.stack,
      metadata: { userId: id, adminId },
    });
    res.status(500).json({ message: "Failed to update user role" });
  }
});

// Remove/delete user
router.delete("/users/:id", [verifyToken, isAdmin], async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.userId;

  // Prevent admin from deleting themselves
  if (id === adminId) {
    return res.status(403).json({
      message: "You cannot delete your own account",
    });
  }

  try {
    // Begin transaction
    const t = await sequelize.transaction();

    try {
      // Find user in MySQL
      const user = await User.findByPk(id);

      if (!user) {
        await t.rollback();
        return res.status(404).json({ message: "User not found" });
      }

      // Store user details for response
      const userDetails = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
      };

      // 1. Find all stories by this user in Elasticsearch
      const storiesResponse = await esClient.search({
        index: "stories",
        body: {
          query: { term: { userId: id.toString() } },
          size: 1000,
          _source: false,
        },
      });

      const storyHits =
        storiesResponse.body?.hits?.hits || storiesResponse.hits?.hits || [];
      const storyIds = storyHits.map((hit) => hit._id);

      console.log(`Found ${storyIds.length} stories to delete for user ${id}`);

      // 2. Find all comments by this user
      const commentsResponse = await esClient.search({
        index: "comments",
        body: {
          query: { term: { userId: id.toString() } },
          size: 1000,
          _source: false,
        },
      });

      const commentHits =
        commentsResponse.body?.hits?.hits || commentsResponse.hits?.hits || [];
      const commentIds = commentHits.map((hit) => hit._id);

      console.log(
        `Found ${commentIds.length} comments to delete for user ${id}`
      );

      // 3. Delete all mentions related to user's content
      if (storyIds.length > 0) {
        await esClient.deleteByQuery({
          index: "mentions",
          refresh: true,
          body: {
            query: {
              bool: {
                must: [
                  { term: { sourceType: "story" } },
                  { terms: { sourceId: storyIds } },
                ],
              },
            },
          },
        });
      }

      if (commentIds.length > 0) {
        await esClient.deleteByQuery({
          index: "mentions",
          refresh: true,
          body: {
            query: {
              bool: {
                must: [
                  { term: { sourceType: "comment" } },
                  { terms: { sourceId: commentIds } },
                ],
              },
            },
          },
        });
      }

      // 4. Delete mentions where this user was mentioned
      await esClient.deleteByQuery({
        index: "mentions",
        refresh: true,
        body: {
          query: { term: { mentionedUserId: id.toString() } },
        },
      });

      // 5. Delete user's comments
      if (commentIds.length > 0) {
        await esClient.deleteByQuery({
          index: "comments",
          refresh: true,
          body: {
            query: { term: { userId: id.toString() } },
          },
        });
      }

      // 6. Delete user's stories and associated likes
      if (storyIds.length > 0) {
        // Delete story likes
        for (const storyId of storyIds) {
          await redisClient.del(`story:${storyId}:likes`);
        }

        // Delete stories
        await esClient.deleteByQuery({
          index: "stories",
          refresh: true,
          body: {
            query: { term: { userId: id.toString() } },
          },
        });
      }

      // 7. Delete user from Elasticsearch
      await esClient.delete({
        index: "users",
        id: id.toString(),
        refresh: true,
      });

      // 8. Finally delete the user from MySQL
      await user.destroy({ transaction: t });

      // Commit transaction
      await t.commit();

      res.status(200).json({
        message: "User and all associated data deleted successfully",
        metadata: {
          userId: id,
          username: userDetails.username,
          storiesDeleted: storyIds.length,
          commentsDeleted: commentIds.length,
          deletedBy: adminId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      // Rollback transaction on error
      await t.rollback();
      throw error;
    }
  } catch (error) {
    console.error("Error deleting user:", {
      message: error.message,
      stack: error.stack,
      metadata: { userId: id, adminId },
    });
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// Get user statistics
router.get("/users/stats", [verifyToken, isAdmin], async (req, res) => {
  try {
    // Get total users count from MySQL
    const totalUsers = await User.count();

    // Get admin users count from MySQL
    const adminUsers = await User.count({
      where: { role: "admin" },
    });

    // Get recent user signups (last 7 days) from MySQL
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsers = await User.count({
      where: {
        createdAt: {
          [Op.gte]: sevenDaysAgo,
        },
      },
    });

    // Get total stories count from Elasticsearch
    const storiesCount = await esClient.count({
      index: "stories",
    });

    // Get total comments count from Elasticsearch
    const commentsCount = await esClient.count({
      index: "comments",
    });

    // Extract counts from responses
    const totalStories = storiesCount.count || storiesCount.body?.count || 0;
    const totalComments = commentsCount.count || commentsCount.body?.count || 0;

    res.status(200).json({
      stats: {
        totalUsers,
        totalStories,
        totalComments,
        newUsersLast7Days: newUsers,
        adminUsers,
        regularUsers: totalUsers - adminUsers,
        averageStoriesPerUser:
          totalUsers > 0 ? (totalStories / totalUsers).toFixed(2) : 0,
        averageCommentsPerUser:
          totalUsers > 0 ? (totalComments / totalUsers).toFixed(2) : 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching user statistics:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Failed to retrieve user statistics" });
  }
});

// Get single user details
router.get("/users/:id", [verifyToken, isAdmin], async (req, res) => {
  const { id } = req.params;

  try {
    // Get user from MySQL
    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] }, // Exclude password
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get user's content counts from Elasticsearch
    const storiesCount = await esClient.count({
      index: "stories",
      body: { query: { term: { userId: id.toString() } } },
    });

    const commentsCount = await esClient.count({
      index: "comments",
      body: { query: { term: { userId: id.toString() } } },
    });

    // Check if user exists in Elasticsearch and sync if not
    const userExistsInEs = await esClient.exists({
      index: "users",
      id: id.toString(),
    });

    if (!userExistsInEs.body && !userExistsInEs) {
      // User doesn't exist in Elasticsearch, sync now
      await syncUserToElasticsearch(user);
    }

    // Add content counts to user data
    const userData = user.toJSON();
    userData.storiesCount = storiesCount.count || storiesCount.body?.count || 0;
    userData.commentsCount =
      commentsCount.count || commentsCount.body?.count || 0;

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error fetching user details:", {
      message: error.message,
      stack: error.stack,
      metadata: { userId: id },
    });
    res.status(500).json({ message: "Failed to retrieve user details" });
  }
});

// Admin endpoint to delete a comment
router.delete(
  "/comments/delete/:id",
  [verifyToken, isAdmin],
  async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.userId;

    try {
      // Check if the comment exists
      const commentExists = await esClient.exists({
        index: "comments",
        id,
      });

      if (!commentExists.body && !commentExists) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Get the comment details to log information
      const commentResponse = await esClient.get({
        index: "comments",
        id,
      });

      const comment = commentResponse.body || commentResponse;
      const storyId = comment._source.storyId;

      console.log(
        `Admin deletion: Started deletion process for comment ${id} from story ${storyId}`
      );

      // Step 1: Delete mentions for this comment
      await esClient.deleteByQuery({
        index: "mentions",
        refresh: true,
        body: {
          query: {
            bool: {
              must: [
                { term: { sourceId: id } },
                { term: { sourceType: "comment" } },
              ],
            },
          },
        },
      });
      console.log(`Admin deletion: Deleted mentions for comment ${id}`);

      // Step 2: Delete the comment itself
      await esClient.delete({
        index: "comments",
        id,
        refresh: true,
      });

      res.status(200).json({
        message: "Comment deleted successfully by admin",
        metadata: {
          commentId: id,
          storyId: storyId,
          deletedBy: adminId,
          adminAction: true,
        },
      });
    } catch (error) {
      console.error("Error in admin comment deletion:", {
        message: error.message,
        stack: error.stack,
        metadata: { commentId: id, adminId },
      });
      res.status(500).json({ message: "Failed to delete comment" });
    }
  }
);

// Admin delete endpoint for stories
router.delete(
  "/stories/delete/:id",
  [verifyToken, isAdmin],
  async (req, res) => {
    const { id } = req.params;
    const adminId = req.user.userId;

    try {
      // Check if the story exists
      const storyExists = await esClient.exists({
        index: "stories",
        id,
      });

      if (!storyExists.body && !storyExists) {
        return res.status(404).json({ message: "Story not found" });
      }

      // Step 1: Get all comments associated with this story
      const commentsResponse = await esClient.search({
        index: "comments",
        body: {
          query: {
            term: { storyId: id },
          },
          size: 1000,
          _source: false,
        },
      });

      // Extract comment IDs
      let commentIds = [];
      if (
        commentsResponse.body &&
        commentsResponse.body.hits &&
        commentsResponse.body.hits.hits
      ) {
        commentIds = commentsResponse.body.hits.hits.map((hit) => hit._id);
      } else if (commentsResponse.hits && commentsResponse.hits.hits) {
        commentIds = commentsResponse.hits.hits.map((hit) => hit._id);
      }

      console.log(
        `Admin deletion: Found ${commentIds.length} comments for story ${id}`
      );

      // Step 2: Delete mentions for comments
      if (commentIds.length > 0) {
        await esClient.deleteByQuery({
          index: "mentions",
          refresh: true,
          body: {
            query: {
              bool: {
                must: [
                  { term: { sourceType: "comment" } },
                  { terms: { sourceId: commentIds } },
                ],
              },
            },
          },
        });
        console.log(
          `Admin deletion: Deleted mentions for ${commentIds.length} comments`
        );
      }

      // Step 3: Delete story mentions
      await esClient.deleteByQuery({
        index: "mentions",
        refresh: true,
        body: {
          query: {
            bool: {
              must: [
                { term: { sourceId: id } },
                { term: { sourceType: "story" } },
              ],
            },
          },
        },
      });
      console.log(`Admin deletion: Deleted mentions for story ${id}`);

      // Step 4: Delete comments
      if (commentIds.length > 0) {
        await esClient.deleteByQuery({
          index: "comments",
          refresh: true,
          body: {
            query: {
              term: { storyId: id },
            },
          },
        });
        console.log(
          `Admin deletion: Deleted ${commentIds.length} comments for story ${id}`
        );
      }

      // Step 5: Delete likes from Redis
      await redisClient.del(`story:${id}:likes`);
      console.log(`Admin deletion: Deleted likes for story ${id}`);

      // Step 6: Finally delete the story itself
      await esClient.delete({
        index: "stories",
        id,
        refresh: true,
      });

      res.status(200).json({
        message: "Story and all associated data deleted successfully by admin",
        metadata: {
          storyId: id,
          commentsDeleted: commentIds.length,
          deletedBy: adminId,
          adminAction: true,
        },
      });
    } catch (error) {
      console.error("Error in admin story deletion:", {
        message: error.message,
        stack: error.stack,
        metadata: { storyId: id, adminId },
      });
      res.status(500).json({ message: "Failed to delete story" });
    }
  }
);

// Endpoint to sync all users from MySQL to Elasticsearch
router.post(
  "/sync-users-to-elasticsearch",
  [verifyToken, isAdmin],
  async (req, res) => {
    try {
      // Check if users index exists, create if not
      const indexExists = await esClient.indices.exists({ index: "users" });
      if (!indexExists.body && !indexExists) {
        await createUserIndex();
      }

      // Get all users from MySQL
      const users = await User.findAll();

      console.log(`Starting sync of ${users.length} users to Elasticsearch`);

      // Track sync results
      const results = {
        total: users.length,
        successful: 0,
        failed: 0,
        failures: [],
      };

      // Sync each user
      for (const user of users) {
        try {
          await syncUserToElasticsearch(user);
          results.successful++;
        } catch (error) {
          results.failed++;
          results.failures.push({
            userId: user.id,
            username: user.username,
            error: error.message,
          });
        }
      }

      res.status(200).json({
        message: "User sync completed",
        results,
      });
    } catch (error) {
      console.error("Error syncing users to Elasticsearch:", {
        message: error.message,
        stack: error.stack,
      });
      res
        .status(500)
        .json({ message: "Failed to sync users to Elasticsearch" });
    }
  }
);

// Add these routes to your existing userMgmtRoutes.js file

// Get user stories with pagination
router.get("/users/:id/stories", [verifyToken, isAdmin], async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    // First verify if the user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Search for stories in Elasticsearch
    const storiesResponse = await esClient.search({
      index: "stories",
      body: {
        query: {
          term: { userId: id.toString() }
        },
        sort: [{ createdAt: { order: "desc" } }],
        from: offset,
        size: limit
      }
    });

    // Handle different Elasticsearch client response formats
    let hits = [];
    if (storiesResponse.body && storiesResponse.body.hits && storiesResponse.body.hits.hits) {
      hits = storiesResponse.body.hits.hits;
    } else if (storiesResponse.hits && storiesResponse.hits.hits) {
      hits = storiesResponse.hits.hits;
    }

    // Format stories
    const stories = hits.map(hit => ({
      id: hit._id,
      ...hit._source,
      // Add additional story metadata if needed
    }));

    // Get total count
    const countResponse = await esClient.count({
      index: "stories",
      body: {
        query: {
          term: { userId: id.toString() }
        }
      }
    });

    const total = countResponse.count || 
                  countResponse.body?.count || 
                  hits.length;

    res.status(200).json({
      stories,
      metadata: {
        total,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error("Error fetching user stories:", {
      message: error.message,
      stack: error.stack,
      metadata: { userId: id }
    });
    res.status(500).json({ message: "Failed to retrieve user stories" });
  }
});

// Get user comments with pagination
router.get("/users/:id/comments", [verifyToken, isAdmin], async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    // First verify if the user exists
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Search for comments in Elasticsearch
    const commentsResponse = await esClient.search({
      index: "comments",
      body: {
        query: {
          term: { userId: id.toString() }
        },
        sort: [{ createdAt: { order: "desc" } }],
        from: offset,
        size: limit
      }
    });

    // Handle different Elasticsearch client response formats
    let hits = [];
    if (commentsResponse.body && commentsResponse.body.hits && commentsResponse.body.hits.hits) {
      hits = commentsResponse.body.hits.hits;
    } else if (commentsResponse.hits && commentsResponse.hits.hits) {
      hits = commentsResponse.hits.hits;
    }

    // Format comments and fetch associated story titles
    const comments = await Promise.all(hits.map(async hit => {
      const comment = {
        id: hit._id,
        ...hit._source
      };

      // Try to fetch the story title if possible
      if (comment.storyId) {
        try {
          const storyResponse = await esClient.get({
            index: "stories",
            id: comment.storyId
          });
          
          const storySource = storyResponse.body?._source || storyResponse._source;
          if (storySource) {
            comment.storyTitle = storySource.title || "Unknown Story";
          }
        } catch (err) {
          console.warn(`Failed to fetch story title for comment ${comment.id}: ${err.message}`);
          comment.storyTitle = "Unknown Story";
        }
      }

      return comment;
    }));

    // Get total count
    const countResponse = await esClient.count({
      index: "comments",
      body: {
        query: {
          term: { userId: id.toString() }
        }
      }
    });

    const total = countResponse.count || 
                  countResponse.body?.count || 
                  hits.length;

    res.status(200).json({
      comments,
      metadata: {
        total,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error("Error fetching user comments:", {
      message: error.message,
      stack: error.stack,
      metadata: { userId: id }
    });
    res.status(500).json({ message: "Failed to retrieve user comments" });
  }
});

// // Helper function to create user index
// async function createUserIndex() {
//   try {
//     const response = await esClient.indices.create({
//       index: "users",
//       body: {
//         settings: {
//           analysis: {
//             analyzer: {
//               username_analyzer: {
//                 type: "custom",
//                 tokenizer: "keyword",
//                 filter: ["lowercase"],
//               },
//             },
//           },
//         },
//         mappings: {
//           properties: {
//             userId: { type: "keyword" },
//             username: {
//               type: "text",
//               analyzer: "username_analyzer",
//               fields: {
//                 keyword: {
//                   type: "keyword",
//                   normalizer: "lowercase",
//                 },
//               },
//             },
//             displayName: { type: "text" },
//             email: { type: "keyword" },
//             role: { type: "keyword" },
//             createdAt: { type: "date" },
//             updatedAt: { type: "date" },
//           },
//         },
//       },
//     });
//     console.log("User index created successfully:", response);
//   } catch (error) {
//     console.error("Error creating user index:", error);
//     throw error;
//   }
// }



module.exports = router;
