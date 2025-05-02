const esClient = require("../config/esClient");

/**
 * Extract mentions from text
 * @param {string} text - The text to extract mentions from
 * @returns {Array} - Array of usernames mentioned in the text
 */
const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g;
  const matches = text.match(mentionRegex);
  if (!matches) return [];

  // Remove @ symbol and return unique usernames
  return [...new Set(matches.map((match) => match.substring(1)))];
};

/**
 * Process mentions and create mention records
 * @param {string} text - Text to process for mentions
 * @param {string} sourceId - ID of the source (story or comment)
 * @param {string} sourceType - Type of source ('story' or 'comment')
 * @param {string} createdBy - User ID of the creator
 */
async function processMentions(text, sourceId, sourceType, createdBy) {
  try {
    // Extract mentions from text (usernames starting with @)
    const usernames = extractMentions(text);
    console.log(`Extracted ${usernames.length} mentions from text`);

    if (usernames.length === 0) {
      return; // No mentions to process
    }

    // Search for mentioned users in Elasticsearch
    const response = await esClient.search({
      index: "users",
      body: {
        query: {
          terms: {
            username: usernames.map((username) => username.toLowerCase()),
          },
        },
        size: 100, // Make sure we get all users
      },
    });

    // The response structure can vary based on Elasticsearch version
    // Try different paths to access hits safely
    let hits = [];

    if (response.body && response.body.hits && response.body.hits.hits) {
      // Elasticsearch client v7+
      hits = response.body.hits.hits;
    } else if (response.hits && response.hits.hits) {
      // Direct response format
      hits = response.hits.hits;
    } else {
      console.warn(
        "Unexpected Elasticsearch response structure for user search:",
        JSON.stringify(response).substring(0, 500) + "..."
      );
      return; // Can't process further without hits
    }

    console.log(`Found ${hits.length} matching users for mentions`);

    if (hits.length === 0) {
      console.log("No matching users found for mentions");
      return;
    }

    // Create mention documents for each found user
    const mentions = hits.map((hit) => {
      // Get userId from the correct path based on ES version
      const mentionedUserId = hit._source?.userId || hit._id;

      console.log(
        `Creating mention for user ${mentionedUserId} in ${sourceType} ${sourceId} by ${createdBy}`
      );

      return {
        mentionedUserId,
        sourceId,
        sourceType,
        createdBy,
        createdAt: new Date().toISOString(),
        read: false,
      };
    });

    // Skip if createBy is mentioning themselves
    const filteredMentions = mentions.filter(
      (m) => m.mentionedUserId !== createdBy
    );

    console.log(
      `Creating ${filteredMentions.length} mentions after filtering self-mentions`
    );

    // Bulk index mentions
    if (filteredMentions.length > 0) {
      const body = filteredMentions.flatMap((doc) => [
        { index: { _index: "mentions" } },
        doc,
      ]);

      const bulkResponse = await esClient.bulk({ refresh: true, body });
      if (bulkResponse.errors) {
        console.error(
          "Bulk indexing errors:",
          bulkResponse.items.filter((item) => item.index.error)
        );
      } else {
        console.log(
          `Successfully processed ${filteredMentions.length} mentions`
        );
      }
    }
  } catch (error) {
    console.error("Error processing mentions:", error);
    // Rethrow for better error handling upstream
    throw new Error(`Mention processing failed: ${error.message}`);
  }
}

module.exports = {
  extractMentions,
  processMentions,
};
