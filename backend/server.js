// index.js - Main application file
require("dotenv").config(); // Load environment variables first
const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // Add security headers
const rateLimit = require("express-rate-limit");
const { sequelize, initializeDatabase } = require("./config/mysql");
const {
  initializeElasticsearchIndices,
} = require("./models/elasticsearch/initIndices");
const errorHandler = require("./middlewares/errorHandler");

// Routes imports
const authRoutes = require("./routes/authRoutes");
const storyRoutes = require("./routes/storyRoutes");
const userRoutes = require("./routes/userRoutes");
// const searchRoutes = require("./routes/searchRoutes");
const healthRoutes = require("./routes/healthRoutes");

const app = express();

// Global rate limiting middleware
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: "Too many requests from this IP, please try again later",
});

// Middleware setup
app.use(cors());
app.use(helmet());
app.use(globalLimiter);
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/users", userRoutes);
// app.use("/api/search", searchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Not found", path: req.originalUrl });
});

// Global error handler
app.use(errorHandler);

// Initialize database and services
async function initializeServices() {
  try {
    // Connect to MySQL
    await initializeDatabase();
    console.log("MySQL connected");

    // Sync Sequelize models with the database
    await sequelize.sync({ force: false });
    console.log("MySQL database synced successfully");

    // Initialize all Elasticsearch indices
    await initializeElasticsearchIndices();
    console.log("Elasticsearch indices initialized");

    return true;
  } catch (err) {
    console.error("Service initialization error:", {
      message: err.message,
      stack: err.stack,
    });
    return false;
  }
}

// Export the app for testing
module.exports = { app, initializeServices };

// Start the server only if not in a test environment
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;

  initializeServices().then((success) => {
    if (success) {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } else {
      console.error("Failed to initialize services, server not started");
      process.exit(1);
    }
  });
}
