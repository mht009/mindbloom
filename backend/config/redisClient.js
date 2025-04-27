const redis = require("redis");

const redisClient = redis.createClient({
  url: "redis://localhost:6379",
});

// Connect to Redis
redisClient
  .connect()
  .then(() => console.log("Redis client connected"))
  .catch((err) => console.error("Redis connection error:", err));

module.exports = redisClient;
