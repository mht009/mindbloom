const express = require("express");
const esClient = require("../config/esClient");
const redisClient = require("../config/redisClient");
const verifyToken = require("../middlewares/verifyToken");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Save a story
router.post("/stories", verifyToken, async (req, res) => {
  const { title, body, hashtags } = req.body;
  const userId = req.user.userId;

  if (!title || !body || !hashtags) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const story = {
    id: uuidv4(),
    userId,
    title,
    body,
    hashtags,
    createdAt: new Date().toISOString(),
  };

  try {
    await esClient.index({
      index: "stories",
      id: story.id,
      body: story,
    });

    res.status(201).json({
      message: "Story created successfully",
      storyId: story.id,
    });
  } catch (error) {
    console.error("Error saving story:", error);
    res.status(500).json({ message: "Failed to save story" });
  }
});

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

// Post a comment on a story
router.post("/stories/:id/comments", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;
  const { body } = req.body;

  if (!body) {
    return res.status(400).json({ message: "Comment body is required" });
  }

  const comment = {
    storyId: id,
    userId,
    body,
    createdAt: new Date().toISOString(),
  };

  try {
    const response = await esClient.index({
      index: "comments",
      body: comment,
    });

    const responseData = response.body || response;
    res.status(201).json({
      message: "Comment posted successfully",
      comment: {
        id: responseData._id,
        ...comment,
      },
    });
  } catch (error) {
    console.error("Error posting comment:", error);
    res.status(500).json({ message: "Failed to post comment" });
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

// Edit a comment
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
router.get('/stories/hashtag/:hashtag', async (req, res) => {
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
      { createdAt: { order: 'desc' } }, // Newest stories first
    ],
  };

  if (lastFetchedCreatedAt) {
    query.query = {
      bool: {
        must: [
          { term: { hashtags: hashtag } }
        ],
        filter: {
          range: {
            createdAt: { lt: lastFetchedCreatedAt } // Fetch stories created before the last fetched one
          }
        }
      }
    };
  }

  try {
    const response = await esClient.search({
      index: 'stories',
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
    console.error('Error fetching stories by hashtag:', error);
    res.status(500).json({ message: 'Failed to fetch stories by hashtag' });
  }
});


module.exports = router;
