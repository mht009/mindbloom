// utils/dataRetention.js
const { Op } = require("sequelize");
const { Conversation, Message } = require("../models/mysql/Conversations");
const cron = require("node-cron");

/**
 * Delete conversations and associated messages older than 30 days
 */
async function cleanupOldConversations() {
  try {
    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find conversations older than 30 days
    const oldConversations = await Conversation.findAll({
      where: {
        lastMessageAt: {
          // Using lastMessageAt
          [Op.lt]: thirtyDaysAgo,
        },
      },
      attributes: ["id"],
    });

    const oldConversationIds = oldConversations.map((conv) => conv.id);

    if (oldConversationIds.length > 0) {
      // Delete associated messages first (for foreign key constraints)
      await Message.destroy({
        where: {
          conversationId: {
            [Op.in]: oldConversationIds,
          },
        },
      });

      // Delete the conversations
      const deletedCount = await Conversation.destroy({
        where: {
          id: {
            [Op.in]: oldConversationIds,
          },
        },
      });

      console.log(
        `Cleaned up ${deletedCount} conversations older than 30 days`
      );
    } else {
      console.log("No conversations older than 30 days found");
    }
  } catch (error) {
    console.error("Error cleaning up old conversations:", error);
  }
}

/**
 * Schedule cleanup job to run daily at midnight
 */
function scheduleCleanupJob() {
  // Run daily at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("Running scheduled cleanup of old conversations");
    await cleanupOldConversations();
  });

  console.log("Scheduled data retention cleanup job");
}

module.exports = {
  cleanupOldConversations,
  scheduleCleanupJob,
};
