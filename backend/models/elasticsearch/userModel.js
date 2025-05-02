

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
                  filter: ["lowercase"]
                }
              }
            }
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
                    normalizer: "lowercase"
                  }
                }
              },
              displayName: { type: "text" },
              email: { type: "keyword" },
              createdAt: { type: "date" }
            }
          }
        }
      });
  
      console.log("User index created successfully:", response);
    } catch (error) {
      console.error("Error creating user index:", error);
      throw error;
    }
  }
  
  module.exports = { createUserIndex };