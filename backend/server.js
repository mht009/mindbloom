require("dotenv").config(); // Load environment variables first
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { initializeDatabase } = require("./config/mysql");
const authRoutes = require("./routes/authRoutes");
const app = express();
const { sequelize } = require("./config/mysql");

// Middleware setup
app.use(cors());
app.use(bodyParser.json());

// Connect to MySQL
initializeDatabase()
  .then(() => console.log("MySQL connected"))
  .catch((err) => console.error("MySQL connection error:", err));

// Sync Sequelize models with the database
sequelize
  .sync({ force: false }) // Set `force: true` to drop and recreate tables
  .then(() => {
    console.log("Database synced successfully.");
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
  });

// Routes
app.use("/api/auth", authRoutes);

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
