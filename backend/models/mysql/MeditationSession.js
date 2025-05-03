// models/MeditationSession.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/mysql");
const User = require("./User");

const MeditationSession = sequelize.define("MeditationSession", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
  duration: {
    type: DataTypes.INTEGER, // Duration in minutes
    allowNull: false,
    validate: {
      min: 1, // At least 1 minute
    },
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  meditationType: {
    type: DataTypes.STRING,
    allowNull: true, // Optional field to track different types of meditation
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true, // Optional notes from the user
  },
});

// Establish relationship with User model
MeditationSession.belongsTo(User, { foreignKey: "userId" });
User.hasMany(MeditationSession, { foreignKey: "userId" });

module.exports = MeditationSession;
