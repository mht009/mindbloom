const esClient = require("../../config/esClient");

async function createUserIndex() {
  try {
    const indexExists = await esClient.indices.exists({ index: "users" });
    if (indexExists) {
      console.log("Index 'users' already exists. Skipping creation.");
      return;
    }

    const response = await esClient.indices.create({
      index: "users",
      body: {
        settings: {
          analysis: {
            analyzer: {
              username_analyzer: {
                type: "custom",
                tokenizer: "keyword",
                filter: ["lowercase"],
              },
            },
          },
        },
        mappings: {
          properties: {
            userId: { type: "keyword" },
            username: {
              type: "text",
              analyzer: "username_analyzer",
              fields: {
                keyword: {
                  type: "keyword",
                  normalizer: "lowercase",
                },
              },
            },
            displayName: { type: "text" },
            email: { type: "keyword" },
            createdAt: { type: "date" },
          },
        },
      },
    });

    console.log("User index created successfully:", response);
  } catch (error) {
    console.error("Error creating user index:", error);
    throw error;
  }
}

async function createStoryIndex() {
  try {
    // Check if the index already exists
    const indexExists = await esClient.indices.exists({ index: "stories" });

    if (indexExists) {
      console.log("Index 'stories' already exists. Skipping creation.");
      return;
    }

    // Create the index if it doesn't exist
    const response = await esClient.indices.create({
      index: "stories",
      body: {
        mappings: {
          properties: {
            userId: { type: "keyword" },
            title: { type: "text" },
            body: { type: "text" },
            hashtags: { type: "keyword" },
            createdAt: { type: "date" },
          },
        },
      },
    });
    console.log("Story index created successfully:", response);
  } catch (error) {
    console.error("Error creating story index:", error);
  }
}

// esClient.js - Add a new function to create the comments index

async function createCommentIndex() {
  try {
    // Check if the index already exists
    const indexExists = await esClient.indices.exists({ index: "comments" });

    if (indexExists) {
      console.log("Index 'comments' already exists. Skipping creation.");
      return;
    }

    // Create the index if it doesn't exist

    const response = await esClient.indices.create({
      index: "comments",
      body: {
        mappings: {
          properties: {
            storyId: { type: "keyword" }, // Story to which this comment belongs
            userId: { type: "keyword" }, // User who posted the comment
            body: { type: "text" }, // Body of the comment
            createdAt: { type: "date" }, // Timestamp of when the comment was created
          },
        },
      },
    });

    console.log("Comment index created successfully:", response);
  } catch (error) {
    console.error("Error creating comment index:", error);
  }
}

async function createMentionsIndex() {
  try {
    // Check if the index already exists
    const indexExists = await esClient.indices.exists({ index: "mentions" });
    if (indexExists) {
      console.log("Index 'mentions' already exists. Skipping creation.");
      return;
    }

    // Create the index if it doesn't exist
    const response = await esClient.indices.create({
      index: "mentions",
      body: {
        mappings: {
          properties: {
            mentionedUserId: { type: "keyword" }, // User who was mentioned
            sourceId: { type: "keyword" }, // ID of the story or comment
            sourceType: { type: "keyword" }, // "story" or "comment"
            createdAt: { type: "date" }, // When the mention was created
            createdBy: { type: "keyword" }, // User who created the mention
            read: { type: "boolean" }, // Whether the mention has been read
          },
        },
      },
    });

    console.log("Mentions index created successfully:", response);
  } catch (error) {
    console.error("Error creating mentions index:", error);
    throw error; // Add this to propagate the error
  }
}

// Define the mapping for the meditation_types index
async function createMeditationTypeIndex() {
  try {
    const indexExists = await esClient.indices.exists({
      index: "meditation_types",
    });

    if (indexExists) {
      console.log(
        "Index 'meditation_types' already exists. Skipping creation."
      );
      return;
    }

    const response = await esClient.indices.create({
      index: "meditation_types",
      body: {
        mappings: {
          properties: {
            id: { type: "keyword" },
            name: { type: "text", fields: { keyword: { type: "keyword" } } },
            description: { type: "text" },
            howToPractice: { type: "text" },
            benefits: { type: "text" },
            recommendedFor: { type: "text" },
            recommendedDuration: { type: "text" },
            imageUrl: { type: "keyword" },
            videoUrl: { type: "keyword" },
            additionalInfo: {
              type: "object",
              enabled: true,
            },
            order: { type: "integer" },
            createdAt: { type: "date" },
            updatedAt: { type: "date" },
          },
        },
      },
    });
    console.log(`Created index: meditation_types`, response);
  } catch (error) {
    console.error("Error creating meditation_types index:", error);
    throw error;
  }
}

/**
 * Main function to initialize all indices
 */
async function initializeElasticsearchIndices() {
  try {
    await createUserIndex();
    await createStoryIndex();
    await createCommentIndex();
    await createMentionsIndex();
    await createMeditationTypeIndex();
    console.log("All Elasticsearch indices initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Elasticsearch indices:", {
      message: error.message,
      stack: error.stack,
    });
    throw error; // Propagate error
  }
}

module.exports = {
  createStoryIndex,
  createCommentIndex,
  createMentionsIndex,
  createUserIndex,
  createMeditationTypeIndex,
  initializeElasticsearchIndices,
};
