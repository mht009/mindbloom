// models/User.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/mysql");

const User = sequelize.define("User", {
  name: {
    type: DataTypes.STRING,
    allowNull: false, // Ensure name is always provided
  },
  username: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true, // Ensure email is unique
    allowNull: true, // Email can be null if phone is provided
    validate: {
      isEmail: true, // Validate if the email format is correct
    },
  },
  phone: {
    type: DataTypes.STRING,
    unique: true, // Ensure phone number is unique
    allowNull: true, // Phone can be null if email is provided
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false, // Password should always be provided
  },
  role: {
    type: DataTypes.ENUM("user", "admin"),
    defaultValue: "user",
  },
  streakCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
});

// Adding custom validation to ensure at least one of email or phone is provided
User.beforeValidate((user, options) => {
  if (!user.email && !user.phone) {
    throw new Error("Either email or phone number must be provided");
  }
});

module.exports = User;
