// utils/chatbotUtils.js
const {
  generateChatbotResponse,
  recommendMeditationType,
  handleUserMessage,
} = require("../services/meditationChatbotService");
const { meditationTypes, assessmentQuestions } = require("./meditationData");

// Function to start a new meditation assessment
function startMeditationAssessment() {
  // Get the first question
  const firstQuestion = assessmentQuestions[0];

  // Format the options for display
  const optionsText = firstQuestion.options
    .map((option, index) => `${index + 1}. ${option.text}`)
    .join("\n");

  const questionText = `${firstQuestion.question}\n\n${optionsText}\n\nPlease select the option that best applies to you by entering the corresponding number.`;

  // Create initial conversation state
  const conversationState = {
    messages: [
      { role: "user", content: "I'd like to start the meditation assessment." },
      { role: "assistant", content: questionText },
    ],
    assessmentResponses: {},
    assessmentComplete: false,
    recommendedMeditation: null,
    alternativeMeditation: null,
    guidanceRequested: false,
  };

  return {
    response: questionText,
    conversationState,
  };
}

// Function to handle freeform questions about meditation
async function handleFreeformQuestion(userMessage) {
  // Import the meditation chatbot module
  try {
    // Create message history for Claude
    const messageHistory = [
      {
        role: "user",
        content: userMessage,
      },
    ];

    // Call the meditation chatbot function
    const response = await generateChatbotResponse(messageHistory);
    return response.content;
  } catch (error) {
    console.error("Error handling freeform question:", error);
    return "I'm having trouble processing your question right now. Would you like to try the meditation assessment instead, or ask about a specific meditation technique?";
  }
}

module.exports = {
  handleUserMessage,
  startMeditationAssessment,
  handleFreeformQuestion,
  meditationTypes,
  assessmentQuestions,
};
