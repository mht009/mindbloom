const express = require("express");
const esClient = require("../config/esClient");
const redisClient = require("../config/redisClient"); // Import your Redis client
const verifyToken = require("../middlewares/verifyToken"); // Import your verifyToken middleware
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

// Save a story to Elasticsearch (with token verification)
router.put("/add", verifyToken, async (req, res) => {
  const { title, body, hashtags } = req.body;
  const userId = req.user.userId; // This comes from the decoded token

  if (!title || !body || !hashtags) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const story = {
    id: uuidv4(),
    userId: userId,
    title,
    body,
    hashtags,
    createdAt: new Date(),
  };

  try {
    const response = await esClient.index({
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
router.put("/edit/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, body, hashtags } = req.body;
  const { userId } = req.user;

  // Check if the user is the author of the story
  const story = await esClient.get({ index: "stories", id });
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
});

// Delete a story
router.delete("/delete/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  // Check if the user is the author of the story
  const story = await esClient.get({ index: "stories", id });
  if (!story || story._source.userId !== userId) {
    return res.status(403).json({ message: "You cannot delete this story" });
  }

  // Delete the story from Elasticsearch
  await esClient.delete({
    index: "stories",
    id,
  });

  res.status(200).json({ message: "Story deleted successfully" });
});

router.get("/mystories", verifyToken, async (req, res) => {
  const { userId } = req.user; // Extracted from the token

  try {
    const response = await esClient.search({
      index: "stories",
      body: {
        query: {
          term: { userId: userId }, // Fetch only where userId matches
        },
        sort: [
          { createdAt: { order: "desc" } }, // Optional: sort by newest first
        ],
      },
    });

    const myStories = response.hits.hits.map((hit) => ({
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
router.get("/all", verifyToken, async (req, res) => {
  try {
    // Get the limit and the last fetched timestamp
    const limit = parseInt(req.query.limit) || 5;
    const lastTimestamp = req.query.lastTimestamp; // Use timestamp instead of ID

    // Base query
    const searchQuery = {
      size: limit,
      sort: [
        { createdAt: { order: "desc" } }, // Sort by creation date
      ],
    };

    // Add search_after if we have a last timestamp
    if (lastTimestamp) {
      searchQuery.search_after = [lastTimestamp];
    }

    // Fetch stories from Elasticsearch
    const response = await esClient.search({
      index: "stories",
      body: searchQuery,
    });

    // Map the stories and include the sort value for next pagination
    const stories = response.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
      sort: hit.sort?.[0], // Include the sort value for next pagination
    }));

    // Get the last story's timestamp for next pagination
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
router.post("/:id/like", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    // Convert userId to string before adding to Redis set
    await redisClient.sAdd(`story:${id}:likes`, String(userId));
    res.status(200).json({ message: "Story liked successfully" });
  } catch (err) {
    console.error("Error liking story:", err);
    res.status(500).json({ message: "Error liking story" });
  }
});

// Unlike a story
router.delete("/:id/like", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { userId } = req.user;

  try {
    // Convert userId to string before removing from Redis set
    await redisClient.sRem(`story:${id}:likes`, String(userId));
    res.status(200).json({ message: "Story unliked successfully" });
  } catch (err) {
    console.error("Error unliking story:", err);
    res.status(500).json({ message: "Error unliking story" });
  }
});

// Get likes count
router.get("/:id/likes", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Use sCard instead of scard
    const count = await redisClient.sCard(`story:${id}:likes`);
    res.status(200).json({ likesCount: count });
  } catch (err) {
    console.error("Error getting likes count:", err);
    res.status(500).json({ message: "Error getting likes count" });
  }
});

// Post a comment on a story
router.post("/stories/:id/comments", verifyToken, async (req, res) => {
  const { id } = req.params; // Story ID
  const { userId } = req.user; // From JWT
  const { body } = req.body; // Comment body

  // Create the comment object
  const comment = {
    storyId: id,
    userId,
    body,
    createdAt: new Date(),
  };

  try {
    // Store the comment in Elasticsearch
    const response = await esClient.index({
      index: "comments",
      body: comment,
    });

    res.status(201).json({
      message: "Comment posted successfully",
      comment: {
        id: response.body._id,
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
  const { id } = req.params; // Story ID
  const limit = parseInt(req.query.limit) || 10; // Default to 10 comments
  const lastFetchedId = req.query.lastFetchedId; // Last comment ID (optional)

  // Elasticsearch query for paginated comments
  let query = {
    size: limit,
    query: {
      term: { storyId: id }, // Fetch comments for the specific story
    },
    sort: [{ createdAt: { order: "asc" } }], // Sort comments by creation date (ascending)
  };

  if (lastFetchedId) {
    query.query = {
      bool: {
        must: [{ term: { storyId: id } }],
        filter: { range: { createdAt: { gt: lastFetchedId } } }, // Comments after the last fetched ID
      },
    };
  }

  try {
    // Fetch comments from Elasticsearch
    const response = await esClient.search({
      index: "comments",
      body: query,
    });

    const comments = response.body.hits.hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
    }));

    res.status(200).json({
      comments,
      hasMore: comments.length === limit, // Check if more comments are available
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

// Edit a comment
router.put("/comments/:id", verifyToken, async (req, res) => {
  const { id } = req.params; // Comment ID
  const { userId } = req.user; // From JWT
  const { body } = req.body; // New comment body

  try {
    // Fetch the comment from Elasticsearch
    const existingComment = await esClient.get({
      index: "comments",
      id,
    });

    if (existingComment.body._source.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You can only edit your own comments" });
    }

    // Update the comment
    const updatedComment = {
      ...existingComment.body._source,
      body,
      updatedAt: new Date(),
    };

    await esClient.update({
      index: "comments",
      id,
      body: { doc: updatedComment },
    });

    res
      .status(200)
      .json({ message: "Comment updated successfully", updatedComment });
  } catch (error) {
    console.error("Error editing comment:", error);
    res.status(500).json({ message: "Failed to edit comment" });
  }
});

// Delete a comment
router.delete("/comments/:id", verifyToken, async (req, res) => {
  const { id } = req.params; // Comment ID
  const { userId } = req.user; // From JWT

  try {
    // Fetch the comment from Elasticsearch
    const existingComment = await esClient.get({
      index: "comments",
      id,
    });

    if (existingComment.body._source.userId !== userId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own comments" });
    }

    // Delete the comment
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

module.exports = router;
