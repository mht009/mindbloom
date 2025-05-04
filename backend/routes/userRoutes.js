// src/routes/userRoutes.js
const express = require("express");
const esClient = require("../config/esClient");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// Search for users by username prefix
router.get("/search", verifyToken, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 1) {
      return res.status(400).json({ message: "Search query is required" });
    }

    if (query.length > 50) {
      return res.status(400).json({ message: "Search query too long" });
    }

    const sanitizedQuery = query.toLowerCase().trim();

    const response = await esClient.search({
      index: "users",
      body: {
        size: 10,
        query: {
          prefix: {
            username: sanitizedQuery,
          },
        },
      },
    });

    // Handle different Elasticsearch client response formats
    const hits = response.body?.hits?.hits || response.hits?.hits || [];
    const users = mapUsersResponse(hits);

    res.status(200).json({ users });
  } catch (error) {
    if (error.name === "ResponseError") {
      return res.status(503).json({ message: "Search service unavailable" });
    }
    console.error("Error searching for users:", error);
    res.status(500).json({ message: "Failed to search for users" });
  }
});

// NEW ENDPOINT: Resolve userIds to usernames
router.get("/resolve", verifyToken, async (req, res) => {
  try {
    const { userIds } = req.query;

    if (!userIds) {
      return res.status(400).json({ message: "User IDs are required" });
    }

    // Parse the userIds from the query string (expecting comma-separated values)
    const userIdArray = userIds.split(",").filter((id) => id && id.trim());

    if (userIdArray.length === 0) {
      return res.status(400).json({ message: "No valid user IDs provided" });
    }

    if (userIdArray.length > 50) {
      return res
        .status(400)
        .json({ message: "Too many user IDs. Maximum is 50." });
    }

    // Use Elasticsearch to resolve user IDs to usernames
    const response = await esClient.search({
      index: "users",
      body: {
        size: userIdArray.length,
        query: {
          terms: {
            _id: userIdArray,
          },
        },
      },
    });

    // Extract results
    const hits = response.body?.hits?.hits || response.hits?.hits || [];
    const resolvedUsers = mapUsersResponse(hits);

    res.status(200).json({ users: resolvedUsers });
  } catch (error) {
    console.error("Error resolving user IDs:", error);
    res.status(500).json({ message: "Failed to resolve user IDs" });
  }
});

// Autocomplete for @mentions
router.get("/mentions", verifyToken, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 1) {
      return res.status(400).json({ message: "Query is required" });
    }

    // Remove the @ symbol if it exists at the beginning
    const sanitizedQuery = query.startsWith("@")
      ? query.substring(1).toLowerCase().trim()
      : query.toLowerCase().trim();

    if (sanitizedQuery.length === 0) {
      return res.status(400).json({ message: "Query is too short" });
    }

    // Use Elasticsearch for prefix search
    const response = await esClient.search({
      index: "users",
      body: {
        size: 5, // Limit to 5 suggestions for mentions
        query: {
          prefix: {
            username: sanitizedQuery,
          },
        },
      },
    });

    // Extract results
    const hits = response.body?.hits?.hits || response.hits?.hits || [];
    const suggestions = mapUsersResponse(hits);

    res.status(200).json({ suggestions });
  } catch (error) {
    console.error("Error searching for mentions:", error);
    res.status(500).json({ message: "Failed to search for mentions" });
  }
});

// Utility function for mapping response
const mapUsersResponse = (hits) => {
  return hits.map((hit) => ({
    userId: hit._id,
    username: hit._source.username,
    displayName: hit._source.displayName || hit._source.username,
    avatar: hit._source.avatar || null,
  }));
};

module.exports = router;
