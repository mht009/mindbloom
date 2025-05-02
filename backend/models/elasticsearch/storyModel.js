const esClient = require("../../config/esClient");

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
            sourceId: { type: "keyword" },        // ID of the story or comment
            sourceType: { type: "keyword" },      // "story" or "comment"
            createdAt: { type: "date" },          // When the mention was created
            createdBy: { type: "keyword" },       // User who created the mention
            read: { type: "boolean", default: false } // Whether the mention has been read
          },
        },
      },
    });
    
    console.log("Mentions index created successfully:", response);
  } catch (error) {
    console.error("Error creating mentions index:", error);
  }
}

module.exports = { 
  createStoryIndex, 
  createCommentIndex,
  createMentionsIndex 
};
