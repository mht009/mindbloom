// Mindbloom Meditation Chatbot Implementation
// This code provides a foundation for implementing a chatbot using the Claude API
// that recommends meditation types based on user needs and provides guidance.

const anthropic = require("../config/claudeClient");
const {
  meditationTypes,
  assessmentQuestions,
} = require("../utils/meditationData");

// Define a function to recommend meditation types based on user responses
function recommendMeditationType(userResponses) {
  // Points system for each meditation type
  let scores = {
    mindfulness: 0,
    lovingKindness: 0,
    vipassana: 0,
    focused: 0,
    movement: 0,
    mantra: 0,
    transcendental: 0,
    progressive: 0,
    spiritual: 0,
    visualization: 0,
    sleep: 0,
    relaxation: 0,
    emotional: 0,
  };

  // Experience level mapping
  if (userResponses.experience === "beginner") {
    scores.mindfulness += 3;
    scores.progressive += 2;
    scores.focused += 2;
    scores.relaxation += 2;
    scores.visualization += 1;
    scores.vipassana -= 2; // More challenging for beginners
  } else if (userResponses.experience === "experienced") {
    scores.vipassana += 3;
    scores.transcendental += 2;
    scores.spiritual += 2;
  }

  // Goal mapping
  if (userResponses.goal === "stress_reduction") {
    scores.mindfulness += 3;
    scores.progressive += 3;
    scores.relaxation += 4;
    scores.visualization += 2;
  } else if (userResponses.goal === "focus") {
    scores.focused += 4;
    scores.mindfulness += 2;
    scores.mantra += 2;
  } else if (userResponses.goal === "sleep") {
    scores.sleep += 5;
    scores.progressive += 3;
    scores.relaxation += 2;
  } else if (userResponses.goal === "spiritual") {
    scores.spiritual += 5;
    scores.lovingKindness += 2;
    scores.transcendental += 2;
  } else if (userResponses.goal === "emotional") {
    scores.emotional += 5;
    scores.lovingKindness += 3;
    scores.mindfulness += 2;
  } else if (userResponses.goal === "relaxation") {
    scores.relaxation += 4;
    scores.progressive += 4;
    scores.visualization += 2;
  }

  // Style preference mapping
  if (userResponses.style === "mindfulness") {
    scores.mindfulness += 4;
    scores.vipassana += 2;
  } else if (userResponses.style === "mantra") {
    scores.mantra += 4;
    scores.transcendental += 3;
  } else if (userResponses.style === "movement") {
    scores.movement += 5;
  } else if (userResponses.style === "visualization") {
    scores.visualization += 4;
    scores.sleep += 2;
  } else if (userResponses.style === "loving_kindness") {
    scores.lovingKindness += 4;
    scores.emotional += 2;
  } else if (userResponses.style === "progressive") {
    scores.progressive += 4;
    scores.relaxation += 2;
    scores.sleep += 2;
  }

  // Time availability mapping
  if (userResponses.time === "very_short") {
    scores.mindfulness += 2;
    scores.focused += 2;
    scores.relaxation += 3;
    scores.transcendental -= 2; // Requires more time
    scores.vipassana -= 1; // Typically needs more time
  } else if (userResponses.time === "long") {
    scores.vipassana += 3;
    scores.transcendental += 3;
    scores.spiritual += 2;
  }

  // Challenges mapping
  if (userResponses.challenge === "busy_mind") {
    scores.mantra += 3;
    scores.focused += 3;
    scores.progressive += 2;
  } else if (userResponses.challenge === "physical_discomfort") {
    scores.movement += 4;
    scores.progressive += 3;
    scores.relaxation += 2;
  } else if (userResponses.challenge === "uncertainty") {
    scores.mindfulness += 2; // Straightforward instructions
    scores.focused += 2;
    scores.progressive += 3; // Clear physical process
  } else if (userResponses.challenge === "drowsiness") {
    scores.movement += 3;
    scores.focused += 2;
    scores.mantra += 2;
    scores.sleep -= 3; // Would make drowsiness worse
  } else if (userResponses.challenge === "time_constraint") {
    scores.mindfulness += 2;
    scores.focused += 3;
    scores.transcendental -= 2; // Requires consistent time commitment
  } else if (userResponses.challenge === "skeptical") {
    scores.mindfulness += 3; // Well-researched
    scores.progressive += 2; // Clear physical benefits
    scores.transcendental += 2; // Research-backed
    scores.spiritual -= 1; // Might not appeal to skeptics
  }

  // Find the highest scoring meditation type
  let recommendedType = Object.keys(scores).reduce((a, b) =>
    scores[a] > scores[b] ? a : b
  );

  // Find the second highest scoring type for alternative recommendation
  let alternativeType = Object.keys(scores)
    .filter((type) => type !== recommendedType)
    .reduce((a, b) => (scores[a] > scores[b] ? a : b));

  return {
    primary: recommendedType,
    alternative: alternativeType,
    scores: scores, // Return all scores for debugging or providing multiple options
  };
}

// Claude AI function to generate chatbot responses using the Claude API
async function generateChatbotResponse(
  messages,
  userResponses = null,
  recommendationMade = false
) {
  try {
    // If this is an assessment question and we don't have all responses yet
    if (
      !recommendationMade &&
      (!userResponses ||
        Object.keys(userResponses).length < assessmentQuestions.length)
    ) {
      // Determine which question to ask next
      const nextQuestionIndex = userResponses
        ? Object.keys(userResponses).length
        : 0;

      if (nextQuestionIndex < assessmentQuestions.length) {
        const nextQuestion = assessmentQuestions[nextQuestionIndex];

        // Format the options for display
        const optionsText = nextQuestion.options
          .map((option, index) => `${index + 1}. ${option.text}`)
          .join("\n");

        return {
          type: "assessment_question",
          questionId: nextQuestion.id,
          content: `${nextQuestion.question}\n\n${optionsText}\n\nPlease select the option that best applies to you by entering the corresponding number.`,
        };
      }
    }

    // If we have all responses, make a recommendation
    if (
      !recommendationMade &&
      userResponses &&
      Object.keys(userResponses).length >= assessmentQuestions.length
    ) {
      const recommendation = recommendMeditationType(userResponses);
      const primaryType = meditationTypes[recommendation.primary];
      const alternativeType = meditationTypes[recommendation.alternative];

      let benefitsText = primaryType.benefits
        .map((benefit) => `• ${benefit}`)
        .join("\n");

      return {
        type: "recommendation",
        recommendationType: recommendation.primary,
        alternativeType: recommendation.alternative,
        content: `Based on your responses, I recommend **${primaryType.name}** for you.\n\n${primaryType.description}\n\n**Benefits:**\n${benefitsText}\n\nWould you like me to guide you through how to practice ${primaryType.name}? Or would you prefer to learn about our alternative recommendation, ${alternativeType.name}?`,
      };
    }

    // For follow-up conversations, use Claude API
    const messageHistory = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add system prompt to guide Claude's responses
    messageHistory.unshift({
      role: "system",
      content: `You are a meditation guide for the Mindbloom meditation app. Your purpose is to provide helpful, compassionate guidance about meditation practices. 
      
If the user asks for guidance on a specific meditation type, provide clear step-by-step instructions based on the meditation type guides in your knowledge.

Keep your responses warm, supportive, and encouraging. Use calm, clear language. Avoid technical jargon unless explaining a concept.

If the user asks about meditation benefits, types, or techniques, provide evidence-based information when available.

Remember that meditation is a personal journey - acknowledge that different approaches work for different people, and encourage the user to find what works best for them.

Do not provide medical advice or suggest meditation as a replacement for professional mental health care. If users mention serious mental health concerns, gently suggest speaking with a healthcare provider.`,
    });

    // Call Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: messageHistory,
    });

    return {
      type: "chat_response",
      content: response.content[0].text,
    };
  } catch (error) {
    console.error("Error generating response:", error);
    return {
      type: "error",
      content:
        "I'm having trouble processing your request. Please try again in a moment.",
    };
  }
}

// Example conversation handler function for your webapp
async function handleUserMessage(userMessage, conversationState) {
  // Initialize conversation state if first message
  if (!conversationState) {
    conversationState = {
      messages: [],
      assessmentResponses: {},
      assessmentComplete: false,
      recommendedMeditation: null,
      alternativeMeditation: null,
      guidanceRequested: false,
    };
  }

  // Add user message to conversation history
  conversationState.messages.push({
    role: "user",
    content: userMessage,
  });

  // Check if user is answering an assessment question
  if (!conversationState.assessmentComplete) {
    const currentQuestionIndex = Object.keys(
      conversationState.assessmentResponses
    ).length;

    if (currentQuestionIndex < assessmentQuestions.length) {
      const currentQuestion = assessmentQuestions[currentQuestionIndex];

      // Check if the user's message contains a valid option selection
      const selectedOptionIndex = parseInt(userMessage.trim()) - 1;

      if (
        !isNaN(selectedOptionIndex) &&
        selectedOptionIndex >= 0 &&
        selectedOptionIndex < currentQuestion.options.length
      ) {
        // Record user's response
        conversationState.assessmentResponses[currentQuestion.id] =
          currentQuestion.options[selectedOptionIndex].value;

        // Generate next response (either next question or recommendation)
        const response = await generateChatbotResponse(
          conversationState.messages,
          conversationState.assessmentResponses,
          conversationState.assessmentComplete
        );

        // If this was the last question, mark assessment as complete
        if (
          Object.keys(conversationState.assessmentResponses).length >=
          assessmentQuestions.length
        ) {
          conversationState.assessmentComplete = true;

          // Store the recommendation
          const recommendation = recommendMeditationType(
            conversationState.assessmentResponses
          );
          conversationState.recommendedMeditation = recommendation.primary;
          conversationState.alternativeMeditation = recommendation.alternative;
        }

        // Add response to conversation history
        conversationState.messages.push({
          role: "assistant",
          content: response.content,
        });

        return {
          response: response.content,
          conversationState: conversationState,
        };
      } else {
        // Invalid option selected, ask again
        const optionsText = currentQuestion.options
          .map((option, index) => `${index + 1}. ${option.text}`)
          .join("\n");

        const reaskMessage = `Please select a valid option (1-${currentQuestion.options.length}) for the question:\n\n${currentQuestion.question}\n\n${optionsText}`;

        // Add response to conversation history
        conversationState.messages.push({
          role: "assistant",
          content: reaskMessage,
        });

        return {
          response: reaskMessage,
          conversationState: conversationState,
        };
      }
    }
  }

  // Check if user is responding to meditation recommendation
  if (
    conversationState.assessmentComplete &&
    conversationState.recommendedMeditation &&
    !conversationState.guidanceRequested
  ) {
    // Check if user wants guidance
    const userResponseLower = userMessage.toLowerCase();

    if (
      userResponseLower.includes("guide") ||
      userResponseLower.includes("how") ||
      userResponseLower.includes("yes") ||
      userResponseLower.includes("show me")
    ) {
      // User wants guidance on recommended meditation
      conversationState.guidanceRequested = true;

      const meditationType =
        meditationTypes[conversationState.recommendedMeditation];
      const guideContent = meditationType.guide;

      const response = `Here's how to practice ${meditationType.name}:\n\n${guideContent}\n\nWould you like to know more about this meditation technique or explore other options?`;

      // Add response to conversation history
      conversationState.messages.push({
        role: "assistant",
        content: response,
      });

      return {
        response: response,
        conversationState: conversationState,
      };
    } else if (
      userResponseLower.includes("alternative") ||
      userResponseLower.includes("other") ||
      userResponseLower.includes("different")
    ) {
      // User wants to know about alternative recommendation
      const alternativeType =
        meditationTypes[conversationState.alternativeMeditation];
      let benefitsText = alternativeType.benefits
        .map((benefit) => `• ${benefit}`)
        .join("\n");

      const response = `Our alternative recommendation for you is **${alternativeType.name}**.\n\n${alternativeType.description}\n\n**Benefits:**\n${benefitsText}\n\nWould you like guidance on how to practice ${alternativeType.name}?`;

      // Add response to conversation history
      conversationState.messages.push({
        role: "assistant",
        content: response,
      });

      // Update to track that we're now discussing the alternative
      conversationState.recommendedMeditation =
        conversationState.alternativeMeditation;

      return {
        response: response,
        conversationState: conversationState,
      };
    }
  }

  // Handle specific requests for meditation types
  for (const [meditationKey, meditationData] of Object.entries(
    meditationTypes
  )) {
    if (userMessage.toLowerCase().includes(meditationData.name.toLowerCase())) {
      // User is asking about a specific meditation type
      if (
        userMessage.toLowerCase().includes("how") ||
        userMessage.toLowerCase().includes("guide") ||
        userMessage.toLowerCase().includes("steps") ||
        userMessage.toLowerCase().includes("practice")
      ) {
        // User wants guidance on this meditation type
        const response = `Here's how to practice ${meditationData.name}:\n\n${meditationData.guide}\n\nWould you like to know more about the benefits of this practice?`;

        // Add response to conversation history
        conversationState.messages.push({
          role: "assistant",
          content: response,
        });

        return {
          response: response,
          conversationState: conversationState,
        };
      } else {
        // User wants information about this meditation type
        let benefitsText = meditationData.benefits
          .map((benefit) => `• ${benefit}`)
          .join("\n");

        const response = `**${meditationData.name}**\n\n${meditationData.description}\n\n**Benefits:**\n${benefitsText}\n\nWould you like guidance on how to practice this meditation?`;

        // Add response to conversation history
        conversationState.messages.push({
          role: "assistant",
          content: response,
        });

        return {
          response: response,
          conversationState: conversationState,
        };
      }
    }
  }

  // Handle requests to restart the assessment
  if (
    userMessage.toLowerCase().includes("restart") ||
    userMessage.toLowerCase().includes("start over") ||
    userMessage.toLowerCase().includes("new assessment") ||
    userMessage.toLowerCase().includes("take the quiz again")
  ) {
    // Reset conversation state
    const result = startMeditationAssessment();

    return {
      response: result.response,
      conversationState: result.conversationState,
    };
  }

  // Handle requests for general meditation information
  if (
    userMessage.toLowerCase().includes("what is meditation") ||
    userMessage.toLowerCase().includes("benefits of meditation") ||
    userMessage.toLowerCase().includes("why meditate")
  ) {
    const response = `**What is Meditation?**\n\nMeditation is a practice of training attention and awareness to achieve mental clarity, emotional calm, and stability. It has been practiced for thousands of years across many cultures and is now backed by scientific research showing numerous benefits for physical and mental wellbeing.\n\n**General Benefits of Meditation:**\n\n• Reduces stress and anxiety\n• Improves focus and concentration\n• Enhances self-awareness\n• Promotes emotional health\n• Improves sleep\n• Helps control pain\n• Reduces blood pressure\n• Supports overall wellbeing\n\nDifferent meditation styles offer unique approaches and benefits. Would you like me to recommend a meditation style that might work well for your specific needs?`;

    // Add response to conversation history
    conversationState.messages.push({
      role: "assistant",
      content: response,
    });

    return {
      response: response,
      conversationState: conversationState,
    };
  }

  // Handle requests to list all meditation types
  if (
    userMessage.toLowerCase().includes("list all") ||
    userMessage.toLowerCase().includes("all types") ||
    userMessage.toLowerCase().includes("show me all meditation")
  ) {
    const meditationList = Object.values(meditationTypes)
      .map((type) => `• **${type.name}**: ${type.description.split(".")[0]}.`)
      .join("\n\n");

    const response = `**Meditation Types Available in Mindbloom:**\n\n${meditationList}\n\nWould you like more detailed information about any of these meditation styles?`;

    // Add response to conversation history
    conversationState.messages.push({
      role: "assistant",
      content: response,
    });

    return {
      response: response,
      conversationState: conversationState,
    };
  }

  // For general questions or follow-up conversation, use Claude API
  try {
    const response = await handleFreeformQuestion(userMessage);

    // Add response to conversation history
    conversationState.messages.push({
      role: "assistant",
      content: response,
    });

    return {
      response: response,
      conversationState: conversationState,
    };
  } catch (error) {
    console.error("Error handling freeform question:", error);

    // Fallback response
    const fallbackResponse =
      "I'm having trouble understanding your question. Would you like me to help you find a suitable meditation practice by answering a few questions, or would you like information about a specific meditation type?";

    // Add fallback response to conversation history
    conversationState.messages.push({
      role: "assistant",
      content: fallbackResponse,
    });

    return {
      response: fallbackResponse,
      conversationState: conversationState,
    };
  }
}

// Complete module exports
module.exports = {
  meditationTypes,
  assessmentQuestions,
  recommendMeditationType,
  generateChatbotResponse,
  handleUserMessage,
};
