// utils/meditationType.js
const esClient = require("../config/esClient");

const INDEX_NAME = "meditation_types"; // Elasticsearch index name

// Create or update a meditation type
const saveMeditationType = async (meditationType) => {
  const now = new Date();

  const document = {
    ...meditationType,
    updatedAt: now,
  };

  // If it's a new document, generate an ID and set createdAt
  if (!document.id) {
    document.id = `mt_${Date.now()}`;
    document.createdAt = now;
  }

  await esClient.index({
    index: INDEX_NAME,
    id: document.id,
    body: document,
    refresh: true, // Make the document immediately available for search
  });

  return document;
};

/**
 * Get all meditation types with pagination
 * @param {number} page - Page number (starting from 1)
 * @param {number} limit - Number of items per page
 * @returns {Object} Object containing meditation types array and total count
 */
const getAllMeditationTypes = async (page = 1, limit = 10) => {
  // Calculate from for pagination
  const from = (page - 1) * limit;

  const response = await esClient.search({
    index: INDEX_NAME,
    body: {
      sort: [
        { order: { order: "asc" } },
        { "name.keyword": { order: "asc" } }, // Use keyword field for sorting
      ],
      from: from,
      size: limit,
    },
  });

  const meditationTypes = response.hits.hits.map((hit) => ({
    id: hit._id,
    ...hit._source,
  }));

  const total = response.hits.total.value;

  return {
    meditationTypes,
    total,
  };
};

// Get a meditation type by ID
const getMeditationTypeById = async (id) => {
  try {
    const response = await esClient.get({
      index: INDEX_NAME,
      id,
    });

    return {
      id: response._id,
      ...response._source,
    };
  } catch (error) {
    if (error.statusCode === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Search meditation types with pagination
 * @param {string} query - Search query
 * @param {number} page - Page number (starting from 1)
 * @param {number} limit - Number of items per page
 * @returns {Object} Object containing search results array and total count
 */
const searchMeditationTypes = async (query, page = 1, limit = 10) => {
  // Calculate from for pagination
  const from = (page - 1) * limit;

  const response = await client.search({
    index: INDEX_NAME,
    body: {
      query: {
        multi_match: {
          query,
          fields: [
            "name^3",
            "description^2",
            "howToPractice",
            "benefits",
            "recommendedFor",
            "recommendedDuration",
          ],
          fuzziness: "AUTO",
        },
      },
      from: from,
      size: limit,
    },
  });

  const results = response.hits.hits.map((hit) => ({
    id: hit._id,
    score: hit._score,
    ...hit._source,
  }));

  const total = response.hits.total.value;

  return {
    results,
    total,
  };
};

// Delete a meditation type
const deleteMeditationType = async (id) => {
  try {
    await esClient.delete({
      index: INDEX_NAME,
      id,
      refresh: true,
    });
    return true;
  } catch (error) {
    if (error.statusCode === 404) {
      return false;
    }
    throw error;
  }
};

module.exports = {
  saveMeditationType,
  getAllMeditationTypes,
  getMeditationTypeById,
  searchMeditationTypes,
  deleteMeditationType,
};
