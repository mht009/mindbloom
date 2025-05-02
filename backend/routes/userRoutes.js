const express = require("express");
const esClient = require("../config/esClient");
const verifyToken = require("../middlewares/verifyToken");

const router = express.Router();

// Search for users by username prefix
router.get("/users/search", verifyToken, async (req, res) => {
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

    const users = mapUsersResponse(response.body.hits.hits);
    res.status(200).json({ users });
  } catch (error) {
    if (error.name === "ResponseError") {
      return res.status(503).json({ message: "Search service unavailable" });
    }
    console.error("Error searching for users:", error);
    res.status(500).json({ message: "Failed to search for users" });
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
