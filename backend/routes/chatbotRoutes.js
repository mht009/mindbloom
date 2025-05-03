// routes/chatbotRoutes.js (corrected)
/**
 * Chatbot API Routes
 *
 * These endpoints handle the meditation chatbot functionality.
 * All conversation data is automatically deleted after 30 days.
 */
const express = require("express");
const router = express.Router();
const { handleUserMessage } = require("../utils/chatbotUtils");
const verifyToken = require("../middlewares/verifyToken");
const { asyncHandler } = require("../middlewares/asyncHandler");
const { Conversation } = require("../models/mysql/Conversations");
const { Message } = require("../models/mysql/Messages");

/**
 * @route   POST /api/chatbot/message
 * @desc    Send a message to the chatbot and get a response
 * @access  Private
 */
router.post(
  "/message",
  verifyToken,
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    const userId = req.user.userId;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Find or create conversation for this user
    let conversation = await Conversation.findOne({
      where: { userId, isActive: true },
      order: [["createdAt", "DESC"]],
    });

    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        isActive: true,
      });
    }

    // Save user message to database
    await Message.create({
      conversationId: conversation.id,
      content: message,
      type: "user",
    });

    // Get conversation state from database
    const messages = await Message.findAll({
      where: { conversationId: conversation.id },
      order: [["createdAt", "ASC"]],
    });

    // Convert to format expected by chatbot utils
    const formattedMessages = messages.map((msg) => ({
      role: msg.type,
      content: msg.content,
    }));

    // Retrieve conversation state if exists
    const conversationState = conversation.state
      ? JSON.parse(conversation.state)
      : null;

    // Process message and get response
    const { response, conversationState: newState } = await handleUserMessage(
      message,
      conversationState
    );

    // Save chatbot response to database
    await Message.create({
      conversationId: conversation.id,
      content: response,
      type: "assistant",
    });

    // Update conversation state
    await conversation.update({
      state: JSON.stringify(newState),
    });

    return res.json({
      message: response,
      conversationId: conversation.id,
    });
  })
);

/**
 * @route   GET /api/chatbot/conversations
 * @desc    Get all conversations for a user
 * @access  Private
 */
router.get(
  "/conversations",
  verifyToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    const conversations = await Conversation.findAll({
      where: { userId },
      order: [["updatedAt", "DESC"]],
    });

    return res.json(conversations);
  })
);

/**
 * @route   GET /api/chatbot/conversation/:id
 * @desc    Get a specific conversation with all messages
 * @access  Private
 */
router.get(
  "/conversation/:id",
  verifyToken,
  asyncHandler(async (req, res) => {
    const conversationId = req.params.id;
    const userId = req.user.userId;

    const conversation = await Conversation.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.findAll({
      where: { conversationId },
      order: [["createdAt", "ASC"]],
    });

    return res.json({
      conversation,
      messages,
    });
  })
);

/**
 * @route   POST /api/chatbot/conversation/new
 * @desc    Start a new conversation
 * @access  Private
 */
router.post(
  "/conversation/new",
  verifyToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Set all existing conversations to inactive
    await Conversation.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );

    // Create a new conversation
    const conversation = await Conversation.create({
      userId,
      isActive: true,
    });

    // Add welcome message
    const welcomeMessage =
      "Welcome to Mindbloom Meditation! I'm here to help you discover the right meditation practice for your needs. Would you like to take a quick assessment to find the best meditation type for you?";

    await Message.create({
      conversationId: conversation.id,
      content: welcomeMessage,
      type: "assistant",
    });

    return res.json({
      conversation,
      message: welcomeMessage,
    });
  })
);

/**
 * @route   PUT /api/chatbot/conversation/:id
 * @desc    Update conversation (rename, set active, etc.)
 * @access  Private
 */
router.put(
  "/conversation/:id",
  verifyToken,
  asyncHandler(async (req, res) => {
    const conversationId = req.params.id;
    const userId = req.user.userId;
    const { title, isActive } = req.body;

    const conversation = await Conversation.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // If setting this conversation to active, set all others to inactive
    if (isActive) {
      await Conversation.update(
        { isActive: false },
        { where: { userId, isActive: true } }
      );
    }

    // Update the conversation
    await conversation.update({
      title: title || conversation.title,
      isActive: isActive !== undefined ? isActive : conversation.isActive,
    });

    return res.json(conversation);
  })
);

/**
 * @route   DELETE /api/chatbot/conversation/:id
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete(
  "/conversation/:id",
  verifyToken,
  asyncHandler(async (req, res) => {
    const conversationId = req.params.id;
    const userId = req.user.userId;

    const conversation = await Conversation.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Delete all messages in the conversation
    await Message.destroy({
      where: { conversationId },
    });

    // Delete the conversation
    await conversation.destroy();

    return res.json({ message: "Conversation deleted successfully" });
  })
);

/**
 * @route   POST /api/chatbot/start-assessment
 * @desc    Start meditation assessment process (shortcut)
 * @access  Private
 */
router.post(
  "/start-assessment",
  verifyToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // Find or create conversation
    let conversation = await Conversation.findOne({
      where: { userId, isActive: true },
      order: [["createdAt", "DESC"]],
    });

    if (!conversation) {
      conversation = await Conversation.create({
        userId,
        isActive: true,
      });
    }

    // Start with fresh assessment state
    const { assessmentQuestions } = require("../utils/meditationData");
    const firstQuestion = assessmentQuestions[0];

    // Format the options for display
    const optionsText = firstQuestion.options
      .map((option, index) => `${index + 1}. ${option.text}`)
      .join("\n");

    const questionText = `${firstQuestion.question}\n\n${optionsText}\n\nPlease select the option that best applies to you by entering the corresponding number.`;

    // Save assessment start message
    await Message.create({
      conversationId: conversation.id,
      content: "I'd like to start the meditation assessment.",
      type: "user",
    });

    // Save first question as bot response
    await Message.create({
      conversationId: conversation.id,
      content: questionText,
      type: "assistant",
    });

    // Initialize new conversation state
    const newState = {
      messages: [
        {
          role: "user",
          content: "I'd like to start the meditation assessment.",
        },
        { role: "assistant", content: questionText },
      ],
      assessmentResponses: {},
      assessmentComplete: false,
      recommendedMeditation: null,
      alternativeMeditation: null,
      guidanceRequested: false,
    };

    // Update conversation state
    await conversation.update({
      state: JSON.stringify(newState),
    });

    return res.json({
      message: questionText,
      conversationId: conversation.id,
    });
  })
);

/**
 * @route   GET /api/chatbot/meditation-types
 * @desc    Get all available meditation types
 * @access  Public
 */
router.get(
  "/meditation-types",
  asyncHandler(async (req, res) => {
    const { meditationTypes } = require("../utils/meditationData");
    return res.json(meditationTypes);
  })
);

/**
 * @route   GET /api/chatbot/meditation-type/:type
 * @desc    Get information about a specific meditation type
 * @access  Public
 */
router.get(
  "/meditation-type/:type",
  asyncHandler(async (req, res) => {
    const { meditationTypes } = require("../utils/meditationData");
    const type = req.params.type;

    if (!meditationTypes[type]) {
      return res.status(404).json({ message: "Meditation type not found" });
    }

    return res.json(meditationTypes[type]);
  })
);

module.exports = router;
