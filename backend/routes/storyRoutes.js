const express = require("express");
const esClient = require("../config/esClient");
const redisClient = require("../config/redisClient");
const verifyToken = require("../middlewares/verifyToken");
const { v4: uuidv4 } = require("uuid");
const { processMentions } = require("../utils/mentionUtils");

const router = express.Router();

// Edit a story
router.put("/stories/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, body, hashtags } = req.body;
  const { userId } = req.user;

  try {
    // Check if the user is the author of the story
    const storyResponse = await esClient.get({ index: "stories", id });
    const story = storyResponse.body || storyResponse;

    if (!story || story._source.userId !== userId) {
      return res.status(403).json({ message: "You cannot edit this story" });
    }

    // Update the story in Elasticsearch
    await esClient.update({
      index: "stories",
      id,
      body: {
        doc: {
          title,
          body,
          hashtags,
          updatedAt: new Date().toISOString(),
        },
      },
    });

    // Delete previous mentions for this story
    await esClient.deleteByQuery({
      index: "mentions",
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

    // Process new mentions in both title and body
    await processMentions(title + " " + body, id, "story", userId);

    res.status(200).json({ message: "Story updated successfully" });
  } catch (error) {
    console.error("Error updating story:", error);
    res.status(500).json({ message: "Failed to update story" });
  }
});

// Delete a story
router.delete("/stories/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    // Check if the user is the author of the story
    const storyResponse = await esClient.get({ index: "stories", id });
    const story = storyResponse.body || storyResponse;

    if (!story || story._source.userId !== userId) {
      return res.status(403).json({ message: "You cannot delete this story" });
    }

    // Delete the story from Elasticsearch
    await esClient.delete({
      index: "stories",
      id,
    });

    res.status(200).json({ message: "Story deleted successfully" });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({ message: "Failed to delete story" });
  }
});

// Get user's own stories
router.get("/stories/mine", verifyToken, async (req, res) => {
  const { userId } = req.user;

  try {
    const response = await esClient.search({
      index: "stories",
      body: {
        query: {
          term: { userId },
        },
        sort: [{ createdAt: { order: "desc" } }],
      },
    });

    const responseData = response.body || response;
    const myStories = responseData.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
    }));

    res.status(200).json({ stories: myStories });
  } catch (error) {
    console.error("Error fetching user stories:", error);
    res.status(500).json({ message: "Failed to fetch your stories" });
  }
});

// Get paginated stories for infinite scroll
router.get("/stories", verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const lastTimestamp = req.query.lastTimestamp;

    const searchQuery = {
      size: limit,
      sort: [{ createdAt: { order: "desc" } }],
    };

    if (lastTimestamp) {
      searchQuery.search_after = [lastTimestamp];
    }

    const response = await esClient.search({
      index: "stories",
      body: searchQuery,
    });

    const responseData = response.body || response;
    const stories = responseData.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
      sort: hit.sort?.[0],
    }));

    const lastStoryTimestamp =
      stories.length > 0 ? stories[stories.length - 1].createdAt : null;

    res.status(200).json({
      stories,
      hasMore: stories.length === limit,
      lastTimestamp: lastStoryTimestamp,
    });
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({ message: "Failed to fetch stories" });
  }
});

// Like a story
router.post("/stories/:id/like", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    await redisClient.sAdd(`story:${id}:likes`, String(userId));
    res.status(200).json({ message: "Story liked successfully" });
  } catch (error) {
    console.error("Error liking story:", error);
    res.status(500).json({ message: "Error liking story" });
  }
});

// Unlike a story
router.delete("/stories/:id/like", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    await redisClient.sRem(`story:${id}:likes`, String(userId));
    res.status(200).json({ message: "Story unliked successfully" });
  } catch (error) {
    console.error("Error unliking story:", error);
    res.status(500).json({ message: "Error unliking story" });
  }
});

// Get likes count
router.get("/stories/:id/likes", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const count = await redisClient.sCard(`story:${id}:likes`);
    res.status(200).json({ likesCount: count });
  } catch (error) {
    console.error("Error getting likes count:", error);
    res.status(500).json({ message: "Error getting likes count" });
  }
});

// Post a comment on a story with mentions
router.post("/stories/:id/comments", verifyToken, async (req, res) => {
  const { id: storyId } = req.params;
  const { userId } = req.user;
  const { body } = req.body;

  try {
    const commentId = uuidv4();
    const comment = {
      id: commentId,
      storyId,
      userId,
      body,
      createdAt: new Date().toISOString(),
    };

    // Save comment first
    await esClient.index({
      index: "comments",
      id: commentId,
      body: comment,
      refresh: true,
    });

    // Process mentions in comment body
    await processMentions(body, commentId, "comment", userId);

    res.status(201).json({
      message: "Comment posted successfully",
      comment: {
        id: commentId,
        ...comment,
      },
    });
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).json({ message: "Failed to post comment" });
  }
});

// Edit a comment with mentions
router.put("/comments/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { body } = req.body;

  if (!body) {
    return res.status(400).json({ message: "Comment body is required" });
  }

  try {
    const existingCommentResponse = await esClient.get({
      index: "comments",
      id,
    });

    const existingComment =
      existingCommentResponse.body || existingCommentResponse;

    if (existingComment._source.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own comments" });
    }

    const updatedComment = {
      ...existingComment._source,
      body,
      updatedAt: new Date().toISOString(),
    };

    await esClient.update({
      index: "comments",
      id,
      body: { doc: updatedComment },
    });

    // Delete previous mentions for this comment
    await esClient.deleteByQuery({
      index: "mentions",
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

    // Process new mentions
    await processMentions(body, id, "comment", userId);

    res.status(200).json({
      message: "Comment updated successfully",
      comment: {
        id,
        ...updatedComment,
      },
    });
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({ message: "Failed to edit comment" });
  }
});

// Get comments for a story (paginated)
router.get("/stories/:id/comments", async (req, res) => {
  const { id } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const lastFetchedId = req.query.lastFetchedId;

  let query = {
    size: limit,
    query: {
      term: { storyId: id },
    },
    sort: [{ createdAt: { order: "asc" } }],
  };

  if (lastFetchedId) {
    query.query = {
      bool: {
        must: [{ term: { storyId: id } }],
        filter: { range: { createdAt: { gt: lastFetchedId } } },
      },
    };
  }

  try {
    const response = await esClient.search({
      index: "comments",
      body: query,
    });

    const responseData = response.body || response;
    const comments = responseData.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
    }));

    res.status(200).json({
      comments,
      hasMore: comments.length === limit,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// Delete a comment
router.delete("/comments/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    const existingCommentResponse = await esClient.get({
      index: "comments",
      id,
    });

    const existingComment =
      existingCommentResponse.body || existingCommentResponse;

    if (existingComment._source.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }

    await esClient.delete({
      index: "comments",
      id,
    });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Failed to delete comment" });
  }
});

// Get stories by hashtag (paginated)
router.get("/stories/hashtag/:hashtag", async (req, res) => {
  const { hashtag } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const lastFetchedCreatedAt = req.query.lastFetchedCreatedAt; // Optional for pagination

  let query = {
    size: limit,
    query: {
      term: {
        hashtags: hashtag, // Search stories with this exact hashtag
      },
    },
    sort: [
      { createdAt: { order: "desc" } }, // Newest stories first
    ],
  };

  if (lastFetchedCreatedAt) {
    query.query = {
      bool: {
        must: [{ term: { hashtags: hashtag } }],
        filter: {
          range: {
            createdAt: { lt: lastFetchedCreatedAt }, // Fetch stories created before the last fetched one
          },
        },
      },
    };
  }

  try {
    const response = await esClient.search({
      index: "stories",
      body: query,
    });

    const stories = response.body.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
    }));

    res.status(200).json({
      stories,
      hasMore: stories.length === limit, // If we got full 'limit', then maybe there are more
    });
  } catch (error) {
    console.error("Error fetching stories by hashtag:", error);
    res.status(500).json({ message: "Failed to fetch stories by hashtag" });
  }
});

// Get mentions for the current user (stories and comments where they are tagged)
router.get("/mentions", verifyToken, async (req, res) => {
  const { userId } = req.user;
  const limit = parseInt(req.query.limit) || 10;
  const lastFetchedTimestamp = req.query.lastFetchedTimestamp;
  const unreadOnly = req.query.unreadOnly === "true";

  try {
    let query = {
      size: limit,
      query: {
        bool: {
          must: [{ term: { mentionedUserId: userId } }],
        },
      },
      sort: [{ createdAt: { order: "desc" } }],
    };

    // Add filter for unread mentions if requested
    if (unreadOnly) {
      query.query.bool.must.push({ term: { read: false } });
    }

    // Add pagination filter if lastFetchedTimestamp is provided
    if (lastFetchedTimestamp) {
      query.query.bool.filter = {
        range: { createdAt: { lt: lastFetchedTimestamp } },
      };
    }

    const response = await esClient.search({
      index: "mentions",
      body: query,
    });

    const mentions = [];
    const mentionsData = response.body.hits.hits;

    // Fetch details for each mention
    for (const mention of mentionsData) {
      const source = mention._source;

      try {
        let contentDetails;

        if (source.sourceType === "story") {
          // Fetch story details
          const storyResponse = await esClient.get({
            index: "stories",
            id: source.sourceId,
          });
          contentDetails = storyResponse.body._source || storyResponse._source;
        } else if (source.sourceType === "comment") {
          // Fetch comment details
          const commentResponse = await esClient.get({
            index: "comments",
            id: source.sourceId,
          });
          contentDetails =
            commentResponse.body._source || commentResponse._source;

          // Also fetch the associated story title
          if (contentDetails.storyId) {
            const storyResponse = await esClient.get({
              index: "stories",
              id: contentDetails.storyId,
            });
            const storyDetails =
              storyResponse.body._source || storyResponse._source;
            contentDetails.storyTitle = storyDetails.title;
          }
        }

        // Include user details of who created the mention
        const userResponse = await esClient.get({
          index: "users",
          id: source.createdBy,
        });
        const userDetails = userResponse.body._source || userResponse._source;

        mentions.push({
          id: mention._id,
          type: source.sourceType,
          sourceId: source.sourceId,
          createdAt: source.createdAt,
          read: source.read,
          content: contentDetails,
          mentionedBy: {
            userId: source.createdBy,
            username: userDetails.username,
            displayName: userDetails.displayName || userDetails.username,
          },
        });
      } catch (error) {
        console.error(
          `Error fetching details for mention ${mention._id}:`,
          error
        );
        // Skip this mention if we can't fetch details
        continue;
      }
    }

    res.status(200).json({
      mentions,
      hasMore: mentions.length === limit,
      lastTimestamp:
        mentions.length > 0 ? mentions[mentions.length - 1].createdAt : null,
    });
  } catch (error) {
    console.error("Error fetching mentions:", error);
    res.status(500).json({ message: "Failed to fetch mentions" });
  }
});

// Mark mentions as read
router.put("/mentions/read", verifyToken, async (req, res) => {
  const { userId } = req.user;
  const { mentionIds } = req.body;

  try {
    // If specific mention IDs are provided, mark only those as read
    if (mentionIds && Array.isArray(mentionIds) && mentionIds.length > 0) {
      for (const mentionId of mentionIds) {
        // Verify the mention belongs to the current user
        const mentionResponse = await esClient.get({
          index: "mentions",
          id: mentionId,
        });

        const mention = mentionResponse.body || mentionResponse;
        if (mention._source.mentionedUserId === userId) {
          await esClient.update({
            index: "mentions",
            id: mentionId,
            body: {
              doc: {
                read: true,
              },
            },
          });
        }
      }
    } else {
      // Mark all unread mentions for this user as read
      await esClient.updateByQuery({
        index: "mentions",
        body: {
          query: {
            bool: {
              must: [
                { term: { mentionedUserId: userId } },
                { term: { read: false } },
              ],
            },
          },
          script: {
            source: "ctx._source.read = true",
          },
        },
      });
    }

    res.status(200).json({ message: "Mentions marked as read" });
  } catch (error) {
    console.error("Error marking mentions as read:", error);
    res.status(500).json({ message: "Failed to mark mentions as read" });
  }
});

// Get unread mentions count
router.get("/mentions/count", verifyToken, async (req, res) => {
  const { userId } = req.user;

  try {
    const response = await esClient.count({
      index: "mentions",
      body: {
        query: {
          bool: {
            must: [
              { term: { mentionedUserId: userId } },
              { term: { read: false } },
            ],
          },
        },
      },
    });

    const count = response.body.count || response.count;
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting unread mentions count:", error);
    res.status(500).json({ message: "Failed to get unread mentions count" });
  }
});

module.exports = router;
