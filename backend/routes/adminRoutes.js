// Import the isAdmin middleware
const express = require("express");
const esClient = require("../config/esClient");
const redisClient = require("../config/redisClient");
const verifyToken = require("../middlewares/verifyToken");
const isAdmin = require("../middlewares/isAdmin");

// Admin delete endpoint for stories
router.delete("/delete/:id", [verifyToken, isAdmin], async (req, res) => {
  const { id } = req.params;

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
        size: 1000, // Set an appropriate limit
        _source: false, // We only need IDs
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
        deletedBy: req.user.userId,
        adminAction: true,
      },
    });
  } catch (error) {
    console.error("Error in admin story deletion:", {
      message: error.message,
      stack: error.stack,
      metadata: { storyId: id, adminId: req.user.userId },
    });
    res.status(500).json({ message: "Failed to delete story" });
  }
});
