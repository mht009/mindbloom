// server.js - Main application file
process.env.TZ = "Asia/Kolkata"; // Set timezone to Asia/Kolkata
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
const chatbotLimiter = require("./middlewares/chatBotLimiter");
const { seedMeditationTypes } = require("./seeders/esMeditationTypeSeeder");

const cron = require("node-cron");
const { resetInactiveStreaks } = require("./services/streakService");

// Routes imports
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const storyRoutes = require("./routes/storyRoutes");
const userRoutes = require("./routes/userRoutes");
const userMgmtRoutes = require("./routes/userMgmtRoutes");
const meditationRoutes = require("./routes/meditationRoutes");
const meditationTypeRoutes = require("./routes/meditationTypeRoutes"); // Using ES routes
const healthRoutes = require("./routes/healthRoutes");
const chatbotRoutes = require("./routes/chatbotRoutesG");

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

const { scheduleCleanupJob } = require("./utils/dataRetention");

// Routes
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/usermgmt", userMgmtRoutes);
app.use("/api/stories", storyRoutes);
app.use("/api/users", userRoutes);
app.use("/api/meditation", meditationRoutes);
app.use("/api/meditation-types", meditationTypeRoutes); // Using ES routes
app.use("/api/chatbot", chatbotLimiter, chatbotRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Not found", path: req.originalUrl });
});

// Global error handler
app.use(errorHandler);

// Initialize database and services
async function initializeServices() {
  try {
    console.log(Date());

    // Connect to MySQL
    await initializeDatabase();
    console.log("MySQL connected");

    // Sync Sequelize models with the database
    await sequelize.sync({ force: false });
    console.log("MySQL database synced successfully");

    // Initialize Elasticsearch indices
    await initializeElasticsearchIndices();
    console.log("Elasticsearch indices initialized");

    // Seed meditation types (only if they don't exist yet)
    // await seedMeditationTypes();

    // Schedule data retention cleanup job
    scheduleCleanupJob();
    console.log("Data retention policy (30 days) enforced");

    cron.schedule("0 0 * * *", async () => {
      console.log("Running streak maintenance");
      await resetInactiveStreaks();
    });

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
