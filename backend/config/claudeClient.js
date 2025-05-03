// Import required libraries
const Anthropic = require("@anthropic-ai/sdk");

// Initialize the Claude client with your API key
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

module.exports = anthropic;
