const express = require("express");
const esClient = require("../config/esClient");
const redisClient = require("../config/redisClient");
const verifyToken = require("../middlewares/verifyToken");
const { v4: uuidv4 } = require("uuid");
const { processMentions } = require("../utils/mentionUtils");

const router = express.Router();

// Create a new story
router.post("/", verifyToken, async (req, res) => {
  const { title, body, hashtags } = req.body;
  const { userId } = req.user;

  try {
    // Validate required fields
    if (!title || !body) {
      return res.status(400).json({ message: "Title and body are required" });
    }

    // Generate unique ID for the story
    const storyId = uuidv4();

    // Create story object
    const story = {
      userId,
      title,
      body,
      hashtags: hashtags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Index the story in Elasticsearch
    await esClient.index({
      index: "stories",
      id: storyId,
      body: story,
      refresh: true, // Make the story immediately searchable
    });

    try {
      // Process mentions in both title and body
      await processMentions(title + " " + body, storyId, "story", userId);
    } catch (mentionError) {
      // Log but don't fail the entire request if mentions processing fails
      console.error("Mention processing error:", mentionError);
    }

    // Return success response with created story
    res.status(201).json({
      message: "Story created successfully",
      story: {
        id: storyId,
        ...story,
      },
    });
  } catch (error) {
    console.error("Error creating story:", error);
    res.status(500).json({ message: "Failed to create story" });
  }
});

// Edit a story
router.put("/:id", verifyToken, async (req, res) => {
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
router.delete("/:id", verifyToken, async (req, res) => {
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
router.get("/mine", verifyToken, async (req, res) => {
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
router.get("", verifyToken, async (req, res) => {
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
router.post("/:id/like", verifyToken, async (req, res) => {
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
router.delete("/:id/like", verifyToken, async (req, res) => {
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
router.get("/:id/likes", verifyToken, async (req, res) => {
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
router.post("/:id/comments", verifyToken, async (req, res) => {
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
router.get("/:id/comments", async (req, res) => {
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
router.get("/hashtag/:hashtag", async (req, res) => {
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
    sort: [{ createdAt: { order: "desc" } }], // Newest stories first
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

    // Handle different Elasticsearch client response formats
    let hits;
    if (response.body && response.body.hits && response.body.hits.hits) {
      // Legacy elasticsearch client (e.g., elasticsearch@16)
      hits = response.body.hits.hits;
    } else if (response.hits && response.hits.hits) {
      // Modern @elastic/elasticsearch client (e.g., @elastic/elasticsearch@7 or @8)
      hits = response.hits.hits;
    } else {
      console.warn(
        "Unexpected Elasticsearch response structure:",
        JSON.stringify(response, null, 2).substring(0, 200) + "..."
      );
      return res.status(500).json({
        message: "Invalid response from Elasticsearch",
      });
    }

    const stories = hits.map((hit) => ({
      id: hit._id,
      ...hit._source,
    }));

    res.status(200).json({
      stories,
      hasMore: stories.length === limit, // Indicate if more stories might exist
    });
  } catch (error) {
    console.error("Error fetching stories by hashtag:", {
      message: error.message,
      meta: error.meta?.body?.error || error.meta,
    });
    res.status(500).json({ message: "Failed to fetch stories by hashtag" });
  }
});

// Get mentions for the current user (stories and comments where they are tagged)
// Modified version of the mentions endpoint with better error handling and logging
router.get("/mentions", verifyToken, async (req, res) => {
  const { userId } = req.user;
  const limit = parseInt(req.query.limit) || 10;
  const lastFetchedTimestamp = req.query.lastFetchedTimestamp;
  const unreadOnly = req.query.unreadOnly === "true";

  try {
    console.log(
      `Fetching mentions for user ${userId}, unreadOnly: ${unreadOnly}`
    );

    // Build the query with proper structure
    let queryBody = {
      size: limit,
      query: {
        bool: {
          must: [{ term: { mentionedUserId: userId } }],
        },
      },
      sort: [{ createdAt: { order: "desc" } }],
    };

    // Add the read filter if needed
    if (unreadOnly) {
      queryBody.query.bool.must.push({ term: { read: false } });
    }

    // Add pagination if needed
    if (lastFetchedTimestamp) {
      queryBody.query.bool.filter = {
        range: { createdAt: { lt: lastFetchedTimestamp } },
      };
    }

    console.log("Mentions query:", JSON.stringify(queryBody, null, 2));

    // Execute the search
    const response = await esClient.search({
      index: "mentions",
      body: queryBody,
    });

    // Log the response structure to debug
    console.log(
      "ES response structure:",
      JSON.stringify({
        hasBody: !!response.body,
        hasHits: !!(response.body?.hits || response.hits),
        hitCount: (response.body?.hits?.hits || response.hits?.hits || [])
          .length,
      })
    );

    // Extract hits safely, checking all possible paths
    const hits =
      response.body?.hits?.hits || // New ES client
      response.hits?.hits || // Old ES client
      []; // Default empty

    console.log(`Found ${hits.length} mention hits`);

    // Process each mention with error handling for each one
    const mentions = [];
    for (const hit of hits) {
      try {
        const mentionSource = hit._source;
        if (!mentionSource) {
          console.warn(`No _source for mention ${hit._id}`);
          continue;
        }

        // Start building the mention object
        const mention = {
          id: hit._id,
          type: mentionSource.sourceType,
          sourceId: mentionSource.sourceId,
          createdAt: mentionSource.createdAt,
          read: mentionSource.read,
          content: {},
          mentionedBy: {},
        };

        // Get content details
        try {
          if (mentionSource.sourceType === "story") {
            const storyDoc = await esClient.get({
              index: "stories",
              id: mentionSource.sourceId,
            });

            mention.content = storyDoc.body?._source ||
              storyDoc._source || {
                title: "Unknown Story",
                body: "Content unavailable",
              };
          } else if (mentionSource.sourceType === "comment") {
            const commentDoc = await esClient.get({
              index: "comments",
              id: mentionSource.sourceId,
            });

            const commentSource = commentDoc.body?._source ||
              commentDoc._source || { body: "Comment unavailable" };

            mention.content = commentSource;

            // Add story title if available
            if (commentSource.storyId) {
              try {
                const storyDoc = await esClient.get({
                  index: "stories",
                  id: commentSource.storyId,
                });

                mention.content.storyTitle =
                  (storyDoc.body?._source || storyDoc._source || {}).title ||
                  "Untitled Story";
              } catch (err) {
                console.warn(
                  `Failed to fetch story for comment: ${err.message}`
                );
                mention.content.storyTitle = "Untitled Story";
              }
            }
          }
        } catch (contentErr) {
          console.warn(
            `Error fetching content for mention ${hit._id}: ${contentErr.message}`
          );
          mention.content = { error: "Content unavailable" };
        }

        // Get user details
        try {
          if (mentionSource.createdBy) {
            const userDoc = await esClient.get({
              index: "users",
              id: mentionSource.createdBy,
            });

            const userSource = userDoc.body?._source ||
              userDoc._source || { username: "unknown" };

            mention.mentionedBy = {
              userId: mentionSource.createdBy,
              username: userSource.username,
              displayName: userSource.displayName || userSource.username,
            };
          }
        } catch (userErr) {
          console.warn(
            `Error fetching user for mention ${hit._id}: ${userErr.message}`
          );
          mention.mentionedBy = {
            userId: mentionSource.createdBy,
            username: "Unknown User",
          };
        }

        mentions.push(mention);
      } catch (mentionErr) {
        console.error(`Error processing mention ${hit._id}:`, mentionErr);
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
    // Provide more details in the error response
    res.status(500).json({
      message: "Failed to fetch mentions",
      error: error.message,
      details: error.meta?.body?.error,
    });
  }
});

// Mark mentions as read
router.put("/mentions/read", verifyToken, async (req, res) => {
  const { userId } = req.user;
  const { mentionIds } = req.body;

  try {
    if (mentionIds && Array.isArray(mentionIds) && mentionIds.length > 0) {
      for (const mentionId of mentionIds) {
        const mentionResponse = await esClient.get({
          index: "mentions",
          id: mentionId,
        });

        const mention = mentionResponse.body || mentionResponse;
        if (!mention._source) {
          console.warn(`Mention ${mentionId} not found`);
          continue;
        }
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

    // Handle different response structures
    const count = response.count ?? response.body?.count ?? 0;
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error getting unread mentions count:", error);
    res.status(500).json({ message: "Failed to get unread mentions count" });
  }
});

module.exports = router;
