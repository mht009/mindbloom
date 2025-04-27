require("dotenv").config(); // Load environment variables first
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { initializeDatabase } = require("./config/mysql");
const authRoutes = require("./routes/authRoutes");
const app = express();
const { sequelize } = require("./config/mysql");
const User = require("./models/mysql/user");

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

const verifyToken = require("./middlewares/authMiddleware");

app.get("/profile", verifyToken, async (req, res) => {
  const user = await User.findByPk(req.user.userId);
  if (!user) return res.status(404).json({ message: "User not found" });

  res.status(200).json({ user });
});

// Server setup
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
