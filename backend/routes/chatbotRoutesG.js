// chatbotRoutes.js
/**
 * Chatbot API Routes
 *
 * These endpoints handle the meditation chatbot functionality.
 * All conversation data is automatically deleted after 30 days.
 *
 * It uses the Google Gemini API for generating responses.
 */
const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const { asyncHandler } = require("../middlewares/asyncHandler");
const { Conversation } = require("../models/mysql/Conversations");
const { Message } = require("../models/mysql/Messages");
const User = require("../models/mysql/User");
const { Op } = require("sequelize");
const { sequelize } = require("../config/mysql"); // Import sequelize for transactions

const { genAI } = require("../config/geminiClient");

// Meditation techniques library
const MEDITATION_TECHNIQUES = require("../utils/meditation_lib");

// System prompt for the meditation assistant
const MEDITATION_SYSTEM_PROMPT = `
You are **MindfulGuide**, a compassionate and knowledgeable meditation assistant dedicated to improving users' mental, emotional, and physical well-being through personalized meditation guidance.

**IMPORTANT GUIDELINES:**
- Ask **only ONE question at a time**
- **Never** ask multiple questions in a single response
- Keep responses **short**, **clear**, and **friendly**
- Use **paragraph breaks** and **numbered steps** where needed
- Maintain a **warm**, **non-judgmental**, and **supportive tone**
- Your primary goal is to help users discover meditation practices that genuinely suit their lifestyle and needs

---

**USER DISCOVERY FLOW**  
Ask about these topics **one at a time**, in this order. Wait for the user to respond before asking the next:

1. Their **primary goal** for meditation  
   _(e.g., stress reduction, focus, emotional balance, physical health, sleep improvement, creativity, self-awareness, spiritual growth, etc.)_

2. Their **experience level** with meditation  
   _(e.g., beginner, intermediate, advanced)_

3. Their **current stress level**  
   _(e.g., low, moderate, high)_

4. Their **sleep quality**  
   _(e.g., poor, fair, good)_

5. Their **preferred meditation setting**  
   _(e.g., quiet room, nature, guided app, group session, etc.)_

6. Their **available daily time for meditation**  
   _(e.g., 5 minutes, 10 minutes, 20+ minutes)_

7. Any **physical or mental health concerns** to consider  
   _(e.g., chronic pain, anxiety, PTSD, ADHD, etc.)_

---

**RECOMMENDATION GUIDELINES**

Once you have the above information, recommend **ONE meditation technique** that best suits their needs. Choose from the following or suggest another **credible meditation style** if more appropriate:

- **Mindfulness Meditation** – For stress, focus, depression, general well-being
- **Body Scan Meditation** – For physical tension, pain, insomnia, anxiety
- **Loving-Kindness Meditation** – For social anxiety, relationships, anger, self-worth
- **Breathing Meditation** – For anxiety, focus, panic attacks, beginners
- **Visualization Meditation** – For creativity, performance, motivation, healing
- **Mantra Meditation** – For overthinking, spiritual growth, focus, stress
- **Walking Meditation** – For restlessness, presence, body awareness
- **Yoga Nidra** – For deep rest, sleep, PTSD, nervous system regulation
- **Sound Meditation** – For sensory relaxation, vibrational healing, emotional release
- **Zen (Zazen) Meditation** – For advanced focus, insight, spiritual development
- **Any other well-established meditation method** that suits their profile

---

**RESPONSE FORMAT:**

Start with a short **summary of why you're recommending the technique**.

Then provide:

1. **Name of the technique** and a short description
2. Why it fits the user's goals and preferences
3. Recommended **duration** based on their experience and schedule
4. Simple **step-by-step instructions**
5. Optional tips (e.g., setting, posture, apps)

**End with ONE clear, friendly follow-up question** to continue the conversation or support deeper practice.

Always show empathy, respect, and encouragement. Make the user feel heard and understood.
`;

/**
 * Generate a detailed system prompt with meditation techniques
 * @param {Object} user - User object with profile information
 * @returns {String} - Complete system prompt with user info and techniques
 */
const generateEnhancedSystemPrompt = (user) => {
  let enhancedPrompt = MEDITATION_SYSTEM_PROMPT;

  // Add user profile information if available
  if (user) {
    enhancedPrompt += `\n\nUser Profile:
- Name: ${user.name}
- Meditation Streak: ${user.streakCount} days
- Total Meditation Time: ${user.totalMinutes} minutes\n\n`;
  }

  // Add meditation techniques library
  enhancedPrompt += `\n\n**DETAILED MEDITATION TECHNIQUES REFERENCE**\n\n`;

  // Add each meditation technique with its full details
  Object.keys(MEDITATION_TECHNIQUES).forEach((techniqueKey) => {
    const technique = MEDITATION_TECHNIQUES[techniqueKey];

    enhancedPrompt += `**${technique.name}**:\n`;
    enhancedPrompt += `- **Description**: ${technique.description}\n`;
    enhancedPrompt += `- **Best for**: ${technique.best_for.join(", ")}\n`;
    enhancedPrompt += `- **Difficulty**: ${technique.difficulty}\n`;

    // Add recommended duration based on experience
    enhancedPrompt += `- **Recommended Duration**:\n`;
    Object.entries(technique.recommended_duration).forEach(
      ([level, duration]) => {
        enhancedPrompt += `  - ${level}: ${duration}\n`;
      }
    );

    // Add instructions
    enhancedPrompt += `- **Instructions**:\n`;
    technique.instructions.forEach((step, index) => {
      enhancedPrompt += `  ${index + 1}. ${step}\n`;
    });

    // Add benefits if available
    if (technique.benefits && technique.benefits.length > 0) {
      enhancedPrompt += `- **Benefits**:\n`;
      technique.benefits.forEach((benefit) => {
        enhancedPrompt += `  - ${benefit}\n`;
      });
    }

    enhancedPrompt += `\n`;
  });

  return enhancedPrompt;
};

/**
 * @route   POST /api/chatbot/message
 * @desc    Send a message to the chatbot and get a response
 * @access  Private
 */
router.post(
  "/message",
  verifyToken,
  asyncHandler(async (req, res) => {
    const { message, conversationId } = req.body;
    const { userId } = req.user;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Find or create conversation for this user
    let conversation;

    if (conversationId) {
      // Use existing conversation if ID provided
      conversation = await Conversation.findOne({
        where: { id: conversationId, userId },
      });

      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
    } else {
      // Find active conversation or create new one
      conversation = await Conversation.findOne({
        where: { userId, isActive: true },
        order: [["createdAt", "DESC"]],
      });

      if (!conversation) {
        conversation = await Conversation.create({
          userId,
          isActive: true,
          title: "Meditation Session", // Default title
          lastMessageAt: new Date(),
        });
      }
    }

    // Update lastMessageAt timestamp for data retention
    await conversation.update({ lastMessageAt: new Date() });

    // Save user message to database
    await Message.create({
      conversationId: conversation.id,
      content: message,
      type: "user",
    });

    // Get messages for this conversation
    const messages = await Message.findAll({
      where: { conversationId: conversation.id },
      order: [["createdAt", "ASC"]],
    });

    try {
      // Get Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // Format conversation history for Gemini
      const chatHistory = [];

      // Ensure the first message is from a user
      // (Gemini requires the first message to be from a user)
      if (messages.length > 0 && messages[0].type === "assistant") {
        // If the first message is from assistant, add a dummy user message before it
        chatHistory.push({
          role: "user",
          parts: [{ text: "Hello, I'm interested in meditation." }],
        });
      }

      // Add conversation history, skipping the last user message
      // as we'll send that separately
      for (let i = 0; i < messages.length - 1; i++) {
        const msg = messages[i];
        const role = msg.type === "user" ? "user" : "model";
        chatHistory.push({
          role: role,
          parts: [{ text: msg.content }],
        });
      }

      // Create chat with history and system prompt
      let chatOptions = {};

      if (chatHistory.length > 0) {
        // Use history if available
        chatOptions.history = chatHistory;
      }

      const chat = model.startChat(chatOptions);

      // Get user profile for better personalization
      const user = await User.findByPk(userId, {
        attributes: ["name", "streakCount", "totalMinutes"],
      });

      // Generate enhanced prompt with meditation techniques
      const enhancedSystemPrompt = generateEnhancedSystemPrompt(user);

      // Add the user's latest message
      const userMessage = messages[messages.length - 1].content;

      // Send message with combined context if it's a new chat
      let result;
      if (chatHistory.length === 0) {
        // For a brand new chat, include the context with the first message
        result = await chat.sendMessage(
          enhancedSystemPrompt + "\n\nUser message: " + userMessage
        );
      } else {
        // For existing chats, just send the user message
        result = await chat.sendMessage(userMessage);
      }

      const assistantMessage = result.response.text();

      // Save assistant response to database
      await Message.create({
        conversationId: conversation.id,
        content: assistantMessage,
        type: "assistant",
      });

      return res.json({
        message: assistantMessage,
        conversationId: conversation.id,
      });
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return res.status(500).json({
        message: "Error generating response from AI",
        error: error.message,
      });
    }
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
    const { userId } = req.user;

    const conversations = await Conversation.findAll({
      where: { userId },
      order: [["updatedAt", "DESC"]],
      attributes: [
        "id",
        "title",
        "isActive",
        "createdAt",
        "updatedAt",
        "lastMessageAt",
      ],
      include: [
        {
          model: Message,
          limit: 1,
          order: [["createdAt", "DESC"]],
          attributes: ["content", "createdAt"],
        },
      ],
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
    const { userId } = req.user;

    const conversation = await Conversation.findOne({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const messages = await Message.findAll({
      where: { conversationId },
      order: [["createdAt", "ASC"]],
      attributes: ["id", "content", "type", "createdAt"],
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
    const { userId } = req.user;
    let conversation;

    // Use a transaction to prevent deadlocks
    const transaction = await sequelize.transaction();

    try {
      // Set all existing conversations to inactive
      await Conversation.update(
        { isActive: false },
        {
          where: { userId, isActive: true },
          transaction,
        }
      );

      // Create a new conversation
      conversation = await Conversation.create(
        {
          userId,
          isActive: true,
          title: "Meditation Session",
          lastMessageAt: new Date(),
        },
        { transaction }
      );

      // Add welcome message
      const welcomeMessage =
        "Welcome to Mindbloom Meditation! I'm here to help you discover the right meditation practice for your needs. Would you like to take a quick assessment to find the best meditation type for you?";

      await Message.create(
        {
          conversationId: conversation.id,
          content: welcomeMessage,
          type: "assistant",
        },
        { transaction }
      );

      // Commit the transaction
      await transaction.commit();

      return res.json({
        conversation,
        message: welcomeMessage,
      });
    } catch (error) {
      // If anything goes wrong, roll back the transaction
      await transaction.rollback();
      console.error("Error creating new conversation:", error);
      return res.status(500).json({
        message: "Error creating new conversation",
        error: error.message,
      });
    }
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
    const { userId } = req.user;
    const { title, isActive } = req.body;

    // Use a transaction
    const transaction = await sequelize.transaction();

    try {
      const conversation = await Conversation.findOne({
        where: { id: conversationId, userId },
        transaction,
      });

      if (!conversation) {
        await transaction.rollback();
        return res.status(404).json({ message: "Conversation not found" });
      }

      // If setting this conversation to active, set all others to inactive
      if (isActive) {
        await Conversation.update(
          { isActive: false },
          {
            where: { userId, isActive: true },
            transaction,
          }
        );
      }

      // Update the conversation
      await conversation.update(
        {
          title: title || conversation.title,
          isActive: isActive !== undefined ? isActive : conversation.isActive,
          lastMessageAt: new Date(),
        },
        { transaction }
      );

      // Commit the transaction
      await transaction.commit();

      return res.json(conversation);
    } catch (error) {
      // If anything goes wrong, roll back the transaction
      await transaction.rollback();
      console.error("Error updating conversation:", error);
      return res.status(500).json({
        message: "Error updating conversation",
        error: error.message,
      });
    }
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
    const { userId } = req.user;

    // Use a transaction
    const transaction = await sequelize.transaction();

    try {
      const conversation = await Conversation.findOne({
        where: { id: conversationId, userId },
        transaction,
      });

      if (!conversation) {
        await transaction.rollback();
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Delete all messages in the conversation
      await Message.destroy({
        where: { conversationId },
        transaction,
      });

      // Delete the conversation
      await conversation.destroy({ transaction });

      // Commit the transaction
      await transaction.commit();

      return res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
      // If anything goes wrong, roll back the transaction
      await transaction.rollback();
      console.error("Error deleting conversation:", error);
      return res.status(500).json({
        message: "Error deleting conversation",
        error: error.message,
      });
    }
  })
);

/**
 * @route   GET /api/chatbot/user-stats
 * @desc    Get user meditation stats
 * @access  Private
 */
router.get(
  "/user-stats",
  verifyToken,
  asyncHandler(async (req, res) => {
    const { userId } = req.user;

    const user = await User.findByPk(userId, {
      attributes: ["name", "streakCount", "totalMinutes"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Calculate additional stats
    const conversationCount = await Conversation.count({
      where: { userId },
    });

    const messageCount = await Message.count({
      include: [
        {
          model: Conversation,
          where: { userId },
          attributes: [],
        },
      ],
    });

    // Get session stats
    const firstSession = await Conversation.findOne({
      where: { userId },
      order: [["createdAt", "ASC"]],
      attributes: ["createdAt"],
    });

    return res.json({
      name: user.name,
      streakCount: user.streakCount,
      totalMinutes: user.totalMinutes,
      conversationCount,
      messageCount,
      memberSince: firstSession ? firstSession.createdAt : null,
      averageSessionLength:
        conversationCount > 0 ? user.totalMinutes / conversationCount : 0,
    });
  })
);

module.exports = router;
