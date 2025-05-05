// chatbotRoutes.js
/**
 * Chatbot API Routes
 *
 * These endpoints handle the meditation chatbot functionality.
 * All conversation data is automatically deleted after 30 days.
 *
 * The chatbot uses the Claude Anthropic API for generating responses.
 */
const express = require("express");
const router = express.Router();
const verifyToken = require("../middlewares/verifyToken");
const { asyncHandler } = require("../middlewares/asyncHandler");
const { Conversation } = require("../models/mysql/Conversations");
const { Message } = require("../models/mysql/Messages");
const User = require("../models/mysql/User");
const { Op } = require("sequelize");
const anthropic = require("../config/claudeClient");

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

    // Format messages for Claude API
    const formattedMessages = messages.map((msg) => ({
      role: msg.type,
      content: msg.content,
    }));

    // Get user profile for better personalization
    const user = await User.findByPk(userId, {
      attributes: ["name", "streakCount", "totalMinutes"],
    });

    // Enhanced system prompt with user profile
    let enhancedSystemPrompt = MEDITATION_SYSTEM_PROMPT;

    if (user) {
      enhancedSystemPrompt += `\n\nUser Profile:
- Name: ${user.name}
- Meditation Streak: ${user.streakCount} days
- Total Meditation Time: ${user.totalMinutes} minutes`;
    }

    // Add meditation techniques library reference
    enhancedSystemPrompt += `\n\nYou have access to the following meditation techniques library:
${JSON.stringify(MEDITATION_TECHNIQUES, null, 2)}`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219",
      system: enhancedSystemPrompt,
      max_tokens: 1000,
      messages: formattedMessages,
    });

    // Extract Claude's response
    const assistantMessage = response.content[0].text;

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

    // Set all existing conversations to inactive
    await Conversation.update(
      { isActive: false },
      { where: { userId, isActive: true } }
    );

    // Create a new conversation
    const conversation = await Conversation.create({
      userId,
      isActive: true,
      title: "Meditation Session",
      lastMessageAt: new Date(),
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
    const { userId } = req.user;
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
      lastMessageAt: new Date(),
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
    const { userId } = req.user;

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
