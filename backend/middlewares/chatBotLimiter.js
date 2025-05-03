const rateLimit = require("express-rate-limit");
// More strict rate limiting for chatbot to prevent abuse of the AI API
const chatbotLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // limit each IP to 50 requests per windowMs
  message: "Too many chatbot requests from this IP, please try again later",
});

module.exports = chatbotLimiter;
