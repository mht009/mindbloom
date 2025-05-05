// meditation_lib.js
MEDITATION_TECHNIQUES = {
  mindfulness: {
    name: "Mindfulness Meditation",
    description:
      "A form of meditation that involves focusing on the present moment and accepting it without judgment.",
    best_for: [
      "stress reduction",
      "anxiety",
      "depression",
      "focus improvement",
      "general wellbeing",
    ],
    difficulty: "beginner",
    recommended_duration: {
      beginner: "5-10 minutes",
      intermediate: "15-20 minutes",
      advanced: "30+ minutes",
    },
    instructions: [
      "Find a quiet and comfortable place to sit.",
      "Sit in a position that allows your spine to be straight but not rigid.",
      "Rest your hands on your lap or knees.",
      "Lower your gaze or close your eyes.",
      "Focus your attention on your breath, noticing the sensation of air moving in and out.",
      "When your mind wanders (which is normal), gently bring your attention back to your breath.",
      "Continue this practice for your desired duration.",
      "Before ending, take a moment to notice how your body feels and observe your thoughts and emotions.",
    ],
    benefits: [
      "Reduces stress and anxiety",
      "Improves focus and concentration",
      "Enhances self-awareness",
      "Helps manage emotional reactions",
      "Can improve sleep quality",
    ],
  },

  body_scan: {
    name: "Body Scan Meditation",
    description:
      "A practice that involves systematically focusing attention on different parts of the body, from feet to head or head to feet.",
    best_for: [
      "physical tension",
      "insomnia",
      "anxiety",
      "chronic pain",
      "stress reduction",
    ],
    difficulty: "beginner",
    recommended_duration: {
      beginner: "10 minutes",
      intermediate: "20 minutes",
      advanced: "45 minutes",
    },
    instructions: [
      "Lie down in a comfortable position, preferably on your back.",
      "Close your eyes and take a few deep breaths to settle in.",
      "Begin by bringing awareness to your feet. Notice any sensations - warmth, coolness, tingling, pressure.",
      "Gradually move your attention up through your body (ankles, calves, knees, thighs, etc.).",
      "For each body part, notice any sensations without trying to change them.",
      "If you notice areas of tension, imagine your breath flowing into that area and releasing the tension.",
      "Continue until you've scanned your entire body up to the top of your head.",
      "End by taking a few moments to feel your body as a whole.",
    ],
    benefits: [
      "Releases physical tension",
      "Improves body awareness",
      "Helps with falling asleep",
      "Can reduce chronic pain",
      "Promotes deep relaxation",
    ],
  },

  loving_kindness: {
    name: "Loving-Kindness Meditation",
    description:
      "A practice that focuses on developing feelings of goodwill, kindness, and warmth towards others and yourself.",
    best_for: [
      "social anxiety",
      "relationship issues",
      "self-criticism",
      "anger management",
      "compassion cultivation",
    ],
    difficulty: "intermediate",
    recommended_duration: {
      beginner: "10 minutes",
      intermediate: "15-20 minutes",
      advanced: "30+ minutes",
    },
    instructions: [
      "Sit comfortably with your eyes closed or with a soft gaze.",
      "Begin by focusing on your heart center and taking a few deep breaths.",
      "Bring to mind someone you care about deeply and silently repeat phrases like:",
      "   'May you be happy. May you be healthy. May you be safe. May you live with ease.'",
      "Next, direct these same wishes toward yourself:",
      "   'May I be happy. May I be healthy. May I be safe. May I live with ease.'",
      "Gradually extend these wishes to other people: acquaintances, difficult people, and eventually all beings.",
      "Notice any resistance that comes up and simply acknowledge it without judgment.",
    ],
    benefits: [
      "Increases positive emotions",
      "Decreases social anxiety",
      "Improves relationship satisfaction",
      "Reduces self-criticism",
      "Builds resilience",
    ],
  },

  breathing: {
    name: "Breathing Meditation",
    description:
      "A fundamental meditation practice focusing on the breath as an anchor for attention.",
    best_for: [
      "anxiety",
      "panic attacks",
      "stress reduction",
      "beginners",
      "focus training",
    ],
    difficulty: "beginner",
    recommended_duration: {
      beginner: "5 minutes",
      intermediate: "15 minutes",
      advanced: "30 minutes",
    },
    instructions: [
      "Sit in a comfortable position with your back straight.",
      "Close your eyes or maintain a soft gaze.",
      "Breathe naturally through your nose without trying to control your breath.",
      "Focus your attention on the sensation of breathing - perhaps at the nostrils, chest, or abdomen.",
      "Notice the inhale and exhale, the pause between breaths, and the rhythm of your breathing.",
      "When your mind wanders, gently bring your attention back to your breath.",
      "Try counting breaths (1 to 10 and then start over) if it helps maintain focus.",
    ],
    benefits: [
      "Calms the nervous system",
      "Reduces anxiety and stress",
      "Improves concentration",
      "Can lower heart rate and blood pressure",
      "Accessible for beginners",
    ],
  },

  visualization: {
    name: "Visualization Meditation",
    description:
      "A practice that uses mental imagery to promote relaxation, healing, or goal achievement.",
    best_for: [
      "creativity",
      "motivation",
      "healing",
      "stress relief",
      "performance improvement",
    ],
    difficulty: "intermediate",
    recommended_duration: {
      beginner: "10 minutes",
      intermediate: "15-20 minutes",
      advanced: "30+ minutes",
    },
    instructions: [
      "Find a comfortable position and close your eyes.",
      "Take several deep breaths to relax your body and mind.",
      "Begin to imagine a peaceful scene or environment in detail (a beach, forest, mountain, etc.).",
      "Engage all your senses in this visualization - what do you see, hear, smell, feel?",
      "Immerse yourself in this mental environment, noticing details and allowing the scene to unfold naturally.",
      "If you're visualizing for a specific purpose (like healing), imagine the desired outcome in vivid detail.",
      "Stay with the visualization for your desired duration.",
      "Slowly bring your awareness back to your surroundings before opening your eyes.",
    ],
    benefits: [
      "Reduces stress and anxiety",
      "Enhances creativity",
      "Can help with pain management",
      "Improves athletic or performance skills",
      "Helps achieve goals through mental rehearsal",
    ],
  },

  mantra: {
    name: "Mantra Meditation",
    description:
      "A meditation practice that involves repeating a word, phrase, or sound to focus the mind.",
    best_for: [
      "overthinking",
      "focus problems",
      "spiritual practice",
      "stress reduction",
    ],
    difficulty: "beginner",
    recommended_duration: {
      beginner: "5-10 minutes",
      intermediate: "15-20 minutes",
      advanced: "30+ minutes",
    },
    instructions: [
      "Choose a mantra - this could be a simple sound like 'Om', a phrase like 'I am at peace', or any meaningful word.",
      "Sit comfortably with your spine straight and eyes closed.",
      "Take a few deep breaths to center yourself.",
      "Begin repeating your mantra either out loud or silently.",
      "Maintain a relaxed, steady rhythm with your repetition.",
      "When your mind wanders, gently bring your attention back to the mantra.",
      "Continue for your desired duration.",
      "Gradually let the mantra fade and sit in silence for a moment before opening your eyes.",
    ],
    benefits: [
      "Calms an overactive mind",
      "Creates mental focus",
      "Can induce relaxation response",
      "Supports spiritual practice",
      "Helps overcome negative thought patterns",
    ],
  },

  walking: {
    name: "Walking Meditation",
    description:
      "A mindful practice that focuses attention on the experience of walking, combining physical movement with meditation.",
    best_for: [
      "restlessness",
      "energy balancing",
      "focus development",
      "nature connection",
      "physical activity",
    ],
    difficulty: "beginner",
    recommended_duration: {
      beginner: "10 minutes",
      intermediate: "20 minutes",
      advanced: "45+ minutes",
    },
    instructions: [
      "Find a quiet path or space where you can walk slowly without interruption.",
      "Stand still for a moment and become aware of your body.",
      "Begin walking at a slower pace than normal.",
      "Pay attention to the sensations in your feet and legs as you walk.",
      "Notice the lifting, moving, and placing of each foot.",
      "When your mind wanders, gently bring your attention back to the walking sensation.",
      "You can coordinate your breathing with your steps if it feels natural.",
      "Continue for your desired duration.",
    ],
    benefits: [
      "Good for people who struggle with sitting still",
      "Combines physical activity with mindfulness",
      "Improves body awareness",
      "Can be practiced anywhere",
      "Helps manage restlessness or excess energy",
    ],
  },

  sound: {
    name: "Sound Meditation",
    description:
      "A practice that uses sounds (either environmental or instruments like singing bowls) as the focus of attention.",
    best_for: [
      "auditory processors",
      "focus development",
      "presence cultivation",
      "stress reduction",
    ],
    difficulty: "beginner",
    recommended_duration: {
      beginner: "10 minutes",
      intermediate: "20 minutes",
      advanced: "30+ minutes",
    },
    instructions: [
      "Find a comfortable seated position.",
      "Close your eyes or maintain a soft gaze.",
      "Begin by taking a few deep breaths to center yourself.",
      "Open your awareness to the sounds around you without labeling or judging them.",
      "Notice sounds near and far, loud and subtle.",
      "Pay attention to the beginning, middle, and end of each sound.",
      "When your mind wanders, gently bring your attention back to the soundscape.",
      "Alternatively, focus on a specific sound source like a singing bowl or nature sounds.",
    ],
    benefits: [
      "Develops present moment awareness",
      "Useful for people who process auditory information well",
      "Can be practiced anywhere",
      "Helps develop non-judgmental awareness",
      "Improves concentration",
    ],
  },

  progressive_relaxation: {
    name: "Progressive Muscle Relaxation",
    description:
      "A practice that involves tensing and then relaxing different muscle groups to reduce physical tension and stress.",
    best_for: [
      "high tension",
      "insomnia",
      "anxiety",
      "stress reduction",
      "physical discomfort",
    ],
    difficulty: "beginner",
    recommended_duration: {
      beginner: "10 minutes",
      intermediate: "15 minutes",
      advanced: "20+ minutes",
    },
    instructions: [
      "Lie down in a comfortable position or sit in a supportive chair.",
      "Take a few deep breaths to center yourself.",
      "Starting with your feet, tense the muscles as tightly as you can for 5 seconds.",
      "Release the tension suddenly and completely. Notice the sensation of relaxation.",
      "Rest for 10-15 seconds before moving to the next muscle group.",
      "Continue this pattern moving upward through your body: calves, thighs, abdomen, chest, hands, arms, shoulders, neck, and face.",
      "For each area, tense, hold, release, and notice the difference between tension and relaxation.",
      "After completing all muscle groups, take a moment to scan your body and notice the overall sense of relaxation.",
    ],
    benefits: [
      "Reduces physical tension",
      "Helps with falling asleep",
      "Creates awareness of tension patterns",
      "Reduces anxiety symptoms",
      "Easy to learn and practice anywhere",
    ],
  },

  gratitude: {
    name: "Gratitude Meditation",
    description:
      "A practice focused on cultivating appreciation and thankfulness for positive aspects of life.",
    best_for: [
      "depression",
      "negative thought patterns",
      "mood improvement",
      "resilience building",
    ],
    difficulty: "beginner",
    recommended_duration: {
      beginner: "5 minutes",
      intermediate: "10 minutes",
      advanced: "15+ minutes",
    },
    instructions: [
      "Find a comfortable seated position and close your eyes.",
      "Take several deep breaths to center yourself.",
      "Begin to bring to mind things you're grateful for, starting with simple things.",
      "For each item, really feel the gratitude in your body - notice where and how gratitude manifests physically.",
      "Consider expressing gratitude for: basic needs being met, relationships, opportunities, personal qualities, simple pleasures.",
      "You can mentally repeat phrases like 'I am grateful for...' or simply hold each item in your awareness.",
      "When your mind wanders, gently return to the feeling of gratitude.",
      "End by taking a moment to appreciate the practice itself.",
    ],
    benefits: [
      "Shifts focus from negative to positive",
      "Improves overall mood and outlook",
      "Builds resilience against stress",
      "Enhances feelings of connection",
      "Can help combat depression and anxiety",
    ],
  },
};
