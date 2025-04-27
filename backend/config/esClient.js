const { Client } = require("@elastic/elasticsearch");

const esClient = new Client({
  node: "http://localhost:9200", // your elasticsearch URL
});

// Test the connection
esClient
  .ping()
  .then(() => {
    console.log("Elasticsearch connection successful!");
  })
  .catch((err) => {
    console.error("Elasticsearch connection failed:", err);
  });

module.exports = esClient;
