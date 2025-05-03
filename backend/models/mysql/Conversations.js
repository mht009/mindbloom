// models/Conversation.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/mysql");

const Conversation = sequelize.define(
  "Conversation",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING,
      defaultValue: "Meditation Session",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    state: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "JSON string containing the current state of the conversation",
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: "Timestamp of the last message (used for data retention)",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["userId"],
      },
      {
        fields: ["isActive"],
      },
      {
        fields: ["lastMessageAt"],
      },
    ],
  }
);

module.exports = { Conversation };
