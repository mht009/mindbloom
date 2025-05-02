const esClient = require("../config/esClient");

const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  if (!matches) return [];

  // Remove @ symbol and return unique usernames
  return [...new Set(matches.map((match) => match.substring(1)))];
};

// Process mentions and create mention records
const processMentions = async (text, sourceId, sourceType, createdBy) => {
  const mentions = extractMentions(text);
  if (!mentions.length) return;

  const bulkOperations = [];
  const now = new Date().toISOString();

  try {
    // Search for all mentioned users in one query
    const { body: searchResponse } = await esClient.search({
      index: "users",
      body: {
        query: {
          terms: {
            username: mentions,
          },
        },
        _source: ["userId", "username"],
      },
    });

    const foundUsers = searchResponse.hits.hits;

    // Create mention records for found users
    foundUsers.forEach((user) => {
      bulkOperations.push(
        { index: { _index: "mentions" } },
        {
          sourceId,
          sourceType,
          mentionedUserId: user._source.userId,
          mentionedUsername: user._source.username,
          createdBy,
          createdAt: now,
          read: false,
        }
      );
    });

    if (bulkOperations.length > 0) {
      await esClient.bulk({
        refresh: true,
        body: bulkOperations,
      });
    }
  } catch (error) {
    console.error("Error processing mentions:", error);
    throw error;
  }
};

module.exports = {
  extractMentions,
  processMentions,
};
