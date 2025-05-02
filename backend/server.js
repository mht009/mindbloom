require("dotenv").config(); // Load environment variables first
const express = require("express");
const cors = require("cors");
const helmet = require("helmet"); // Add security headers
const { sequelize, initializeDatabase } = require("./config/mysql");
const {
  createStoryIndex,
  createCommentIndex,
  createMentionsIndex,
} = require("./models/elasticsearch/storyModel");

const { createUserIndex } = require("./models/elasticsearch/userModel");
const authRoutes = require("./routes/authRoutes");
const storyRoutes = require("./routes/storyRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// Middleware setup
app.use(cors());
app.use(helmet());

app.use(express.json());  // For parsing application/json
app.use(express.urlencoded({ extended: true }));  // For parsing 

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/users", userRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// Initialize database and services
async function initializeServices() {
  try {
    // Connect to MySQL
    await initializeDatabase();
    console.log("MySQL connected");

    // Sync Sequelize models with the database
    await sequelize.sync({ force: false });
    console.log("MySQL database synced successfully");

    // Initialize the Elasticsearch story index
    await createStoryIndex();
    await createCommentIndex();
    await createMentionsIndex();
    await createUserIndex();
    console.log("Elasticsearch index created");

    return true;
  } catch (err) {
    console.error("Service initialization error:", err);
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
