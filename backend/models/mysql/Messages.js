// models/Message.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../../config/mysql");
const { Conversation } = require("./Conversations"); // Import Conversation model

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Conversations",
        key: "id",
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("user", "assistant"),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Additional metadata for the message (e.g., meditation type)",
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        fields: ["conversationId"],
      },
      {
        fields: ["type"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);

// Define associations
Conversation.hasMany(Message, {
  foreignKey: "conversationId",
  onDelete: "CASCADE",
});
Message.belongsTo(Conversation, { foreignKey: "conversationId" });

module.exports = { Message };
