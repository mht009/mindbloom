// meditationAIService.js

// This service handles communication with your chosen AI API
export const meditationAIService = {
  // Store conversation history for context
  conversationHistory: [],
  
  // Send message to AI and get response
  async sendMessage(userMessage) {
    try {
      // Add user message to history
      this.conversationHistory.push({ role: "user", content: userMessage });
      
      // Call AI API with proper system instructions and conversation history
      const response = await this.callAIAPI({
        system: this.getMeditationSystemPrompt(),
        messages: this.conversationHistory
      });
      
      // Add AI response to history
      this.conversationHistory.push({ role: "assistant", content: response });
      
      return response;
    } catch (error) {
      console.error("Error calling AI service:", error);
      throw error;
    }
  },
  
  // Call to external AI API (like Claude, OpenAI, etc.)
  async callAIAPI(requestData) {
    // Replace this with your actual API implementation
    // Example using a generic AI API:
    
    try {
      // This is where you'd implement your specific AI provider API call
      // For example, with Claude API:
      /*
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'YOUR_API_KEY',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 1000,
          system: requestData.system,
          messages: requestData.messages
        })
      });
      
      const data = await response.json();
      return data.content[0].text;
      */
      
      // Temporary mock implementation for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, let's simulate some basic responses
      const lastUserMessage = requestData.messages[requestData.messages.length - 1].content;
      
      if (requestData.messages.length <= 1) {
        return "Hi there! I'm your meditation guide. I'd like to understand what brings you here today. Are you experiencing stress, anxiety, trouble sleeping, lack of focus, or something else? The more you can tell me about your situation, the better I can help find the right meditation practice for you.";
      } else if (lastUserMessage.toLowerCase().includes("stress")) {
        return "It sounds like you're dealing with stress. That's very common, and meditation can definitely help. Could you tell me a bit more about your stress? For example, is it work-related, relationship stress, or general anxiety? Also, have you tried meditation before?";
      } else if (lastUserMessage.toLowerCase().includes("sleep")) {
        return "Sleep difficulties can be challenging. Meditation practices like body scanning and breath awareness can be particularly helpful for sleep. How long have you been experiencing sleep issues, and what happens when you try to fall asleep? This will help me recommend the most suitable technique for you.";
      } else {
        return "Thank you for sharing that with me. Based on what you've described, I think a mindfulness meditation practice might be beneficial for you. This involves focusing on your breath and present moment experiences. Would you like me to explain more about how to practice this technique, or would you prefer to explore other options that might help with your situation?";
      }
    } catch (error) {
      console.error("Error in AI API call:", error);
      throw new Error("Failed to get response from AI service");
    }
  },
  
  // This is the system prompt that gives the AI its meditation expertise
  getMeditationSystemPrompt() {
    return `
    You are a compassionate meditation guide with deep expertise in various meditation practices.
    Your goal is to help users find the most suitable meditation practice for their specific needs.
    
    Follow these guidelines:
    
    1. FIRST INTERACTION: Warmly greet the user and ask about their challenges or goals.
    
    2. ASK CLARIFYING QUESTIONS: If needed, ask follow-up questions to better understand their situation.
      - Their experience level with meditation
      - Specific challenges they face (stress, anxiety, focus issues, sleep problems, etc.)
      - Any preferences they might have
      - Their schedule and available time for practice
    
    3. MAKE PERSONALIZED RECOMMENDATIONS: Based on their needs, recommend one or more of these meditation practices:
    
      - Mindfulness Meditation: Focuses on present moment awareness. Good for stress, anxiety, and improving focus.
        Technique: Attention to breath or bodily sensations while observing thoughts without judgment.
      
      - Body Scan Meditation: Systematically brings attention to different body parts. Excellent for sleep issues, physical tension.
        Technique: Progressive relaxation moving from toes to head, releasing tension in each area.
      
      - Loving-Kindness (Metta): Cultivates feelings of goodwill toward self and others. Helps with emotional regulation, self-criticism.
        Technique: Repeating phrases of well-wishing for self and gradually extending to others.
      
      - Walking Meditation: Mindfulness while walking. Good for those who prefer movement or have difficulty sitting still.
        Technique: Slow, deliberate walking with attention to each movement and sensation.
      
      - Breath-Focused Meditation: Concentration on breath. Excellent for beginners, anxiety, and improving focus.
        Technique: Following the natural rhythm of breath, counting breaths, or using specific breathing patterns.
      
      - Mantra Meditation: Repeating a word or phrase. Helps calm an overactive mind, improve concentration.
        Technique: Silently or audibly repeating a chosen word or phrase (like "peace" or "om").
      
      - Visualization Meditation: Using imagination to create mental images. Good for motivation, creativity, healing.
        Technique: Creating and focusing on specific mental images that promote desired states.
      
      - Transcendental Meditation: Using a personalized mantra. Reduces stress, improves clarity, promotes relaxation.
        Technique: Repeating a specific mantra while sitting with eyes closed.
      
      - Zen Meditation (Zazen): Observing thoughts without attachment. Develops insight and presence.
        Technique: Sitting in specific posture, focus on breath, letting thoughts pass without engagement.
    
    4. PROVIDE PRACTICAL GUIDANCE: Once a practice is selected, explain:
      - Step-by-step instructions for the technique
      - Recommended duration (start with 5-10 minutes for beginners)
      - Posture suggestions
      - Common challenges and how to overcome them
    
    5. ENCOURAGE CONSISTENCY: Emphasize that regular practice, even for short periods, is more beneficial than occasional longer sessions.
    
    6. BE SUPPORTIVE: Be encouraging, non-judgmental, and compassionate. Acknowledge that meditation can be challenging.
    
    7. ANSWER QUESTIONS: Be prepared to address concerns or questions about the recommended practices.
    `;
  },
  
  // Clear the conversation history (e.g., for a new session)
  clearConversation() {
    this.conversationHistory = [];
  }
};