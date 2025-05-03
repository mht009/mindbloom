// Define meditation types and their characteristics based on your research
const meditationTypes = {
  mindfulness: {
    name: "Mindfulness Meditation",
    description:
      "Focuses on paying attention to thoughts, sounds, sensations and emotions without judgment.",
    benefits: [
      "Reduces stress and anxiety",
      "Improves focus and attention",
      "Enhances self-awareness",
      "Lowers blood pressure",
      "Improves sleep quality",
    ],
    suitableFor: [
      "beginners",
      "stress",
      "anxiety",
      "focus problems",
      "sleep issues",
    ],
    guide: `
      ### Steps to Practice Mindfulness Meditation

      #### 1. Find a Quiet Space
      * Choose a quiet and comfortable place where you won't be disturbed.
      * Sit in a comfortable position, either on a chair or cross-legged on the floor.
      * Keep your back straight but not stiff.

      #### 2. Set a Time Limit
      * For beginners, 5-10 minutes is a good starting point.
      * You can gradually increase the duration as you become more comfortable.

      #### 3. Be Aware of Your Body
      * Feel the sensations of your body sitting.
      * Notice the points of contact with the floor or chair.

      #### 4. Focus on Your Breath
      * Pay attention to the natural flow of your breath.
      * Feel the air moving in and out of your body.
      * Notice where you feel your breath most prominently - perhaps in your nose, chest, or abdomen.

      #### 5. Notice When Your Mind Wanders
      * Your attention will inevitably wander to thoughts, feelings, sounds, or other sensations.
      * When you notice this happening, simply acknowledge it without judgment.
      * Gently return your focus to your breath.

      #### 6. Be Kind to Your Wandering Mind
      * Don't judge yourself when thoughts arise.
      * Simply note the thought, let it go, and return to your breath.
      * This process of returning is central to the practice.

      #### 7. Close Your Session Mindfully
      * When your time is up, slowly open your eyes.
      * Take a moment to notice how your body feels.
      * Observe your thoughts and emotions.

      #### 8. Practice Regularly
      * Try to practice daily, even if just for a few minutes.
      * Consistency is more important than duration.
    `,
  },

  lovingKindness: {
    name: "Loving-Kindness Meditation",
    description:
      "Focuses on developing feelings of goodwill, kindness, and warmth towards others and yourself.",
    benefits: [
      "Increases positive emotions",
      "Decreases negative emotions",
      "Reduces self-criticism",
      "Builds compassion",
      "Improves relationships",
    ],
    suitableFor: [
      "those struggling with anger",
      "those wanting to improve relationships",
      "people experiencing self-criticism",
      "those seeking emotional resilience",
    ],
    guide: `
      ### Steps to Practice Loving-Kindness Meditation

      #### 1. Find a Comfortable Position
      * Sit in a comfortable and relaxed position.
      * Close your eyes or maintain a soft gaze.
      * Take a few deep breaths to center yourself.

      #### 2. Start with Self-Compassion
      * Begin by directing loving-kindness toward yourself.
      * Place your hand on your heart if it helps you connect.
      * Silently repeat phrases like:
        - "May I be happy"
        - "May I be healthy"
        - "May I be safe"
        - "May I live with ease"

      #### 3. Visualize Receiving Love
      * Imagine these wishes as warm light surrounding you.
      * Feel the sensations in your body as you receive these good wishes.

      #### 4. Extend to a Loved One
      * Bring to mind someone you care deeply about.
      * Direct the same phrases toward them:
        - "May you be happy"
        - "May you be healthy"
        - "May you be safe"
        - "May you live with ease"

      #### 5. Extend to a Neutral Person
      * Think of someone you neither like nor dislike (perhaps a store clerk or acquaintance).
      * Direct the same wishes toward them.

      #### 6. Extend to a Difficult Person
      * If you're ready, bring to mind someone with whom you have difficulty.
      * Start with someone mildly challenging before attempting more difficult relationships.
      * Send them the same wishes for well-being.

      #### 7. Extend to All Beings
      * Finally, extend your loving-kindness to all beings everywhere:
        - "May all beings be happy"
        - "May all beings be healthy"
        - "May all beings be safe"
        - "May all beings live with ease"

      #### 8. Close Your Practice
      * Gently bring your awareness back to your body.
      * Notice how you feel after the practice.
      * Carry this feeling of kindness with you throughout your day.
    `,
  },

  vipassana: {
    name: "Vipassana Meditation",
    description:
      "An ancient technique focused on seeing things as they really are through self-observation and awareness.",
    benefits: [
      "Develops self-awareness",
      "Promotes mental purification",
      "Reduces reactivity to experiences",
      "Cultivates equanimity",
      "Leads to insight and wisdom",
    ],
    suitableFor: [
      "those seeking deeper insights",
      "people looking for transformative practice",
      "individuals with some meditation experience",
      "those interested in Buddhist practices",
    ],
    guide: `
      ### Steps to Perform Vipassana Meditation

      #### 1. Prepare the Environment
      * Choose a quiet place where you won't be disturbed.
      * Sit in a comfortable but alert posture (cross-legged on the floor or on a chair).
      * Keep your back straight and eyes gently closed.

      #### 2. Practice Anapana (Breath Awareness)
      * Focus your attention on the natural breath — the air entering and leaving through your nostrils.
      * Don't control the breath; just observe it as it is.
      * If your mind wanders (it will), gently bring it back to the breath.
      * Do this for 5–10 minutes to calm the mind before moving to Vipassana.

      #### 3. Begin Vipassana: Body Scan
      * Observe physical sensations on your body, starting from the top of the head and moving slowly down to the toes.
      * Be aware of sensations like warmth, pressure, tingling, itching, pain, or any subtle feelings.
      * Move your attention part by part: head → face → neck → shoulders → arms → chest → back → abdomen → hips → legs → feet.
      * Do this slowly and systematically.

      #### 4. Stay Equanimous
      * Whatever sensation you feel — pleasant, unpleasant, or neutral — observe it without reacting.
      * Do not crave pleasant sensations or avoid unpleasant ones.
      * The goal is to develop equanimity and see the impermanent nature of all sensations (anicca).

      #### 5. Continuity and Daily Practice
      * Practice daily, ideally twice a day for 30–60 minutes.
      * Maintain awareness and equanimity in daily life as well.

      #### 6. Close the Session
      * After the body scan, spend a few minutes being aware of the whole body.
      * End with a moment of metta (loving-kindness), silently wishing well-being to all beings.
      
      ### Tips:
      * Start with short sessions (10–15 mins) and build up over time.
      * Avoid mixing this technique with other meditation methods for purity of practice.
      * Consider attending a 10-day retreat for formal training when you're ready.
    `,
  },

  focused: {
    name: "Focused Meditation",
    description:
      "Involves concentration using any of the five senses to focus attention on a single point or object.",
    benefits: [
      "Improves concentration",
      "Reduces mental chatter",
      "Enhances clarity of thought",
      "Builds mental discipline",
      "Develops present moment awareness",
    ],
    suitableFor: [
      "people with racing thoughts",
      "those who struggle with concentration",
      "analytical minds",
      "those who prefer structure",
    ],
    guide: `
      ### Steps to Practice Focused Meditation

      #### 1. Choose Your Focus Object
      * Select something to focus your attention on. This could be:
        - A candle flame
        - A specific sound (like a gong or a repeated mantra)
        - Your breath
        - A specific body sensation
        - Counting mala beads
        - Gazing at an object (like a crystal or mandala)

      #### 2. Find a Comfortable Position
      * Sit in a position that allows you to be comfortable yet alert.
      * Make sure your spine is straight to promote alertness.
      * Rest your hands comfortably on your lap or knees.

      #### 3. Limit Distractions
      * Choose a quiet place.
      * Turn off notifications on devices.
      * Let others know not to disturb you during this time.

      #### 4. Set a Time
      * Decide how long you want to meditate.
      * For beginners, 5-10 minutes is a good starting point.
      * Set a gentle timer to avoid checking the clock.

      #### 5. Direct Your Focus
      * Bring your full attention to your chosen object.
      * Observe it in detail, engaging fully with the experience.
      * If using breath as focus: feel the sensations of breathing, the rise and fall, the temperature of the air.
      * If using a visual object: notice its colors, textures, shapes, how light plays on it.

      #### 6. Notice When Your Mind Wanders
      * Your mind will inevitably drift to thoughts, memories, or plans.
      * When you notice this happening, gently acknowledge it.
      * Without judgment, return your attention to your focus object.

      #### 7. Practice Returning Your Focus
      * The essence of this practice is the returning, not perfect focus.
      * Each time you notice your mind has wandered and bring it back, you're strengthening your concentration muscle.

      #### 8. End Your Session Mindfully
      * When your timer sounds, don't rush to get up.
      * Take a moment to notice how you feel after the practice.
      * Gradually widen your awareness to the room around you before opening your eyes.
    `,
  },

  movement: {
    name: "Movement Meditation",
    description:
      "Uses movement as the focus of meditation, helping those who find it difficult to sit still.",
    benefits: [
      "Combines physical and mental benefits",
      "Increases body awareness",
      "Improves coordination",
      "Reduces physical tension",
      "Accessible for those who struggle with stillness",
    ],
    suitableFor: [
      "people with high energy levels",
      "those who struggle with sitting still",
      "individuals who enjoy physical activity",
      "those seeking body-mind connection",
    ],
    guide: `
      ### Steps to Practice Movement Meditation

      #### 1. Choose Your Movement Practice
      * Select a form of movement that appeals to you:
        - Walking meditation
        - Gentle yoga
        - Tai Chi
        - Qigong
        - Free-form dance
        - Mindful stretching

      #### 2. Find an Appropriate Space
      * Choose an area with enough room to move safely.
      * For walking meditation, a quiet path, garden, or indoor space where you can walk in circles or back and forth.
      * For other practices, ensure you have enough space to move without restrictions.

      #### 3. Set Your Intention
      * Take a moment to breathe deeply and set an intention for your practice.
      * Remember that this is meditation through movement, not exercise.
      * The focus is on awareness, not performance.

      #### 4. Start Slowly
      * Begin with slow, deliberate movements.
      * Pay careful attention to each movement, how it feels in your body.
      * If walking, notice the sensation of your feet touching the ground, the shifting of weight, the balance.

      #### 5. Coordinate with Breath
      * Try to synchronize your movement with your breath when possible.
      * For example, take two steps while inhaling, and three steps while exhaling.
      * Let your breath be natural, not forced.

      #### 6. Maintain Present Moment Awareness
      * Focus on the sensations in your body as you move.
      * Notice temperature, pressure, stretching, effort, release.
      * When your mind wanders, gently bring it back to the physical sensations of movement.

      #### 7. Engage All Senses
      * Be aware of sounds, sights, smells around you as you move.
      * Feel the air on your skin, the ground beneath you.
      * This multi-sensory awareness anchors you in the present moment.

      #### 8. End Mindfully
      * Gradually slow down your movements.
      * Come to a comfortable standing or sitting position.
      * Take a few moments of stillness to observe how you feel after the practice.

      ### Tips for Different Movement Meditations:
      
      #### For Walking Meditation:
      * Walk slower than normal, with deliberate steps.
      * You can use phrases coordinated with steps: "lifting, moving, placing" as you walk.
      
      #### For Yoga or Tai Chi:
      * Focus on the quality of movement rather than perfect form.
      * Allow each posture or movement to be an exploration rather than a goal.
      
      #### For Free-form Movement:
      * Let your body move intuitively, without choreography.
      * Follow what feels good, always maintaining awareness.
    `,
  },

  mantra: {
    name: "Mantra Meditation",
    description:
      "Uses a repetitive sound, word or phrase to clear the mind and maintain focus.",
    benefits: [
      "Creates helpful sound vibrations",
      "Provides a strong focus point",
      "Reduces distracting thoughts",
      "Helps achieve deeper states of consciousness",
      "Can be energizing or calming depending on the mantra",
    ],
    suitableFor: [
      "those who enjoy repetition",
      "people who dislike silence",
      "those who respond well to auditory input",
      "beginners who struggle with mind-wandering",
    ],
    guide: `
      ### Steps to Practice Mantra Meditation

      #### 1. Choose Your Mantra
      * Select a word, phrase, or sound that resonates with you:
        - Traditional mantras: "Om," "So Hum," "Om Namah Shivaya"
        - Affirmations: "I am at peace," "I am enough"
        - Simple sounds: "One," "Peace," "Love"
      * Your mantra can have spiritual significance or simply be a sound you find calming.

      #### 2. Find a Comfortable Seated Position
      * Sit with your spine straight but not rigid.
      * You can sit on a chair, cushion, or meditation bench.
      * Rest your hands comfortably on your thighs or in your lap.

      #### 3. Begin with a Few Deep Breaths
      * Take 3-5 deep breaths to center yourself.
      * Let your breathing return to its natural rhythm.

      #### 4. Start Repeating Your Mantra
      * Begin saying your mantra aloud (if comfortable in your setting).
      * After a few minutes, transition to whispering.
      * Finally, repeat the mantra mentally.
      * Find a natural rhythm that works for you.

      #### 5. Coordinate with Breath (Optional)
      * You can synchronize your mantra with your breath.
      * For example, silently recite "So" on the inhale and "Hum" on the exhale.
      * Or simply maintain the rhythm of the mantra independent of your breath.

      #### 6. Return to the Mantra When Distracted
      * Your mind will wander to thoughts, sensations, or sounds.
      * When you notice this, gently bring your attention back to your mantra.
      * Do this without judgment or frustration.

      #### 7. Maintain Awareness Behind the Mantra
      * As you continue, try to notice the silence or awareness that exists between and behind the repetitions.
      * The mantra can become subtler as your meditation deepens.

      #### 8. Close Your Practice
      * When your time is complete, stop repeating the mantra.
      * Sit in silence for a minute or two, observing the effects of the practice.
      * Slowly bring your awareness back to your surroundings.

      ### Tips:
      * Start with 5-10 minutes and gradually increase your practice time.
      * It's helpful to use the same mantra for regular practice rather than frequently changing it.
      * Some traditional practices recommend receiving a mantra from a teacher, but you can certainly choose one yourself.
      * The power of the mantra comes from focused repetition rather than from the specific words themselves.
      * If you choose a mantra from a spiritual tradition, it can be respectful to learn about its meaning and context.
    `,
  },

  transcendental: {
    name: "Transcendental Meditation",
    description:
      "A specific form of mantra meditation that uses a personally assigned mantra practiced twice daily.",
    benefits: [
      "Reduces stress and anxiety",
      "Improves cardiovascular health",
      "Enhances brain function",
      "Develops deeper states of relaxation",
      "Has been extensively researched",
    ],
    suitableFor: [
      "those seeking evidence-based practice",
      "people willing to follow structured approach",
      "those looking for twice-daily practice",
      "individuals seeking stress reduction",
    ],
    guide: `
      ### About Transcendental Meditation

      Transcendental Meditation (TM) is a specific technique that is taught by certified instructors through a standardized course. While I can provide general information about the practice, authentic TM requires personalized instruction.

      #### Key Elements of TM Practice

      #### 1. Learning from a Certified Teacher
      * TM is taught by certified teachers in a structured course.
      * Teachers provide a personalized mantra based on factors like age and gender.
      * The course typically includes several sessions over 4 consecutive days.

      #### 2. Basic Practice Structure
      * TM is practiced for 20 minutes, twice daily.
      * It's typically done sitting comfortably with eyes closed.
      * The practice involves effortless use of the mantra.

      #### 3. The Mantra
      * In TM, the mantra is not chanted aloud but repeated mentally.
      * The mantra is used in a specific way that allows the mind to settle naturally.
      * The technique emphasizes effortlessness rather than concentration.

      #### 4. Regular Practice
      * Morning and evening sessions are recommended.
      * Ideally practiced before meals rather than after eating.
      * Consistency is considered important for maximum benefits.

      #### 5. Finding Instruction
      * If you're interested in learning TM:
        - Visit the official TM website (tm.org) to find certified teachers in your area.
        - Be aware that there is typically a fee for the instruction.
        - The course includes lifetime follow-up and support.

      #### General Meditation Alternative
      If you're interested in mantra meditation but not specifically TM, you can try the Mantra Meditation technique described elsewhere in our guide, which incorporates similar elements but can be practiced without formal instruction.
    `,
  },

  progressive: {
    name: "Progressive Relaxation Meditation",
    description:
      "A practice that involves systematically tensing and relaxing different muscle groups to induce physical and mental relaxation.",
    benefits: [
      "Reduces physical tension",
      "Helps identify and release chronic tension",
      "Improves body awareness",
      "Reduces anxiety symptoms",
      "Aids in falling asleep",
    ],
    suitableFor: [
      "those with physical tension or pain",
      "people with anxiety",
      "those with sleep difficulties",
      "beginners to meditation",
      "people who prefer tangible, physical focus",
    ],
    guide: `
      ### Steps to Practice Progressive Relaxation Meditation

      #### 1. Prepare Your Environment
      * Find a quiet, comfortable place where you won't be disturbed.
      * Lie down on your back on a comfortable surface like a bed, yoga mat, or carpet.
      * You may use a pillow under your head and/or knees for comfort.
      * Loosen any tight clothing and remove shoes, glasses, or other restrictive items.

      #### 2. Set Your Intention
      * Take a few deep breaths to center yourself.
      * Set an intention to release tension and promote relaxation throughout your body.

      #### 3. Begin with Breath Awareness
      * Take 5-10 deep, slow breaths.
      * Feel your abdomen rise and fall with each breath.
      * Allow your breathing to find its natural rhythm.

      #### 4. Start the Tension-Release Cycle
      * You'll work through major muscle groups, first tensing each area for 5-10 seconds, then suddenly releasing.
      * As you release, focus on the sensation of relaxation flowing into that area.

      #### 5. Systematic Body Progression
      Follow this sequence, spending about 30 seconds on each muscle group:

      * **Feet**: Curl your toes tightly, then release.
      * **Calves**: Point your toes toward your head, creating tension in your calves, then release.
      * **Thighs**: Press your thighs together or down against the surface, then release.
      * **Buttocks**: Tighten your buttocks, then release.
      * **Abdomen**: Tighten your stomach muscles, then release.
      * **Chest**: Take a deep breath, hold it while tensing your chest, then exhale and release.
      * **Back**: Gently arch your back slightly if comfortable, then release.
      * **Hands**: Make tight fists, then release.
      * **Forearms**: Flex your wrists to tighten the forearms, then release.
      * **Upper arms**: Bend your elbows and tense your biceps, then release.
      * **Shoulders**: Raise your shoulders toward your ears, then release.
      * **Neck**: Gently press your head back against your surface, then release.
      * **Face**: Work through facial muscles by:
        - Raising your eyebrows
        - Squeezing your eyes shut
        - Wrinkling your nose
        - Clenching your jaw
        - Pressing your lips together
        Then release each area after tensing.

      #### 6. Full Body Awareness
      * After completing all muscle groups, take a moment to scan your entire body for any remaining tension.
      * If you notice tension anywhere, repeat the tense-release cycle for that area.

      #### 7. Final Relaxation
      * Spend 2-5 minutes lying still, experiencing the sensation of complete relaxation.
      * Enjoy the feeling of heaviness and warmth throughout your body.

      #### 8. Gentle Return
      * When ready to end, wiggle your fingers and toes gently.
      * Take a few deeper breaths.
      * Stretch if you'd like.
      * Slowly open your eyes and sit up when ready.

      ### Tips:
      * This practice can take 15-20 minutes initially, but may become quicker as you get used to it.
      * You can perform a shorter version focusing only on major muscle groups when time is limited.
      * This is an excellent practice for bedtime as it often induces sleepiness.
      * If you have any injuries or chronic pain, be very gentle with affected areas or skip them.
      * Some people find it helpful to record the instructions at a slow pace to guide their practice.
    `,
  },

  spiritual: {
    name: "Spiritual Meditation",
    description:
      "A practice focused on developing a deeper connection with a higher power or the universe.",
    benefits: [
      "Deepens spiritual connection",
      "Fosters sense of meaning and purpose",
      "Promotes feelings of gratitude",
      "Increases compassion",
      "Creates sense of peace and connectedness",
    ],
    suitableFor: [
      "those on a spiritual path",
      "people seeking meaning and purpose",
      "individuals from various faith traditions",
      "those seeking connection beyond the self",
    ],
    guide: `
      ### Steps to Practice Spiritual Meditation

      #### 1. Create a Sacred Space
      * Designate a quiet area for your practice.
      * Consider adding meaningful items such as:
        - Candles
        - Incense or essential oils
        - Religious or spiritual symbols
        - Natural elements like flowers or stones
      * The space should feel special and conducive to contemplation.

      #### 2. Choose a Comfortable Position
      * Sit in a position that allows you to be comfortable yet alert.
      * This might be cross-legged on the floor, kneeling, or sitting in a chair.
      * In some traditions, specific postures may be recommended.

      #### 3. Begin with Centering
      * Take several deep breaths to center yourself.
      * Release worldly concerns with each exhale.
      * Set an intention to open yourself to spiritual connection.

      #### 4. Opening the Heart
      * Place your attention in the center of your chest, the heart center.
      * Imagine this area softening and opening.
      * Cultivate a feeling of receptivity and openness.

      #### 5. Connect Through Your Chosen Method
      Depending on your spiritual background, you might:
      * **Prayer**: Engage in heartfelt prayer or conversation with the divine
      * **Sacred Texts**: Reflect deeply on a passage from sacred texts
      * **Divine Qualities**: Contemplate qualities like love, compassion, or gratitude
      * **Visualization**: Imagine divine light or presence entering your being
      * **Surrender**: Practice letting go and surrendering to a higher power
      * **Listening**: Quietly listen for inner guidance or wisdom

      #### 6. Rest in Presence
      * After active contemplation, simply rest in the feeling of presence.
      * Allow yourself to be rather than do.
      * Experience the connection you've established without words or effort.

      #### 7. Express Gratitude
      * Before closing, express gratitude for the connection and insights received.
      * Acknowledge the sacred in your life.

      #### 8. Carry the Practice Forward
      * Close with an intention to carry the spiritual awareness into your daily activities.
      * Consider how you might manifest spiritual qualities in your interactions with others.

      ### Approaches for Different Traditions:

      #### For Christian Practice:
      * Focus on connection with God through Christ
      * Use scripture meditation or contemplative prayer
      * Practice the presence of God throughout the meditation

      #### For Buddhist Practice:
      * Focus on awakening Buddha nature within
      * Contemplate teachings on compassion and impermanence
      * Practice loving-kindness toward all beings

      #### For Hindu Practice:
      * Connect with the divine Self (Atman) or chosen deity
      * Use mantras like "Om" or other sacred sounds
      * Visualize divine forms or qualities

      #### For Non-denominational/Universal Practice:
      * Focus on connection with universal love or consciousness
      * Contemplate the interconnectedness of all life
      * Practice gratitude for the wonder of existence

      ### Tips:
      * Approach the practice with sincerity and openness.
      * Don't worry about "doing it right" - authenticity matters more than technique.
      * Regular practice, even if brief, builds a stronger connection than occasional longer sessions.
      * Consider joining a spiritual community that can support your practice.
      * Remember that periods of dryness or disconnection are normal in spiritual practice.
    `,
  },

  visualization: {
    name: "Visualization Meditation",
    description:
      "Uses mental imagery to promote relaxation, healing, or achieving specific goals.",
    benefits: [
      "Reduces stress and anxiety",
      "Helps rehearse successful outcomes",
      "Can promote healing and pain reduction",
      "Enhances creativity",
      "Improves sports and performance skills",
    ],
    suitableFor: [
      "creative individuals",
      "those with specific goals",
      "people seeking healing",
      "visual thinkers",
      "those preparing for performances or events",
    ],
    guide: `
      ### Steps to Practice Visualization Meditation

      #### 1. Prepare Your Space
      * Find a quiet, comfortable place where you won't be disturbed.
      * Sit or recline in a comfortable position.
      * Ensure the room temperature is comfortable for stillness.

      #### 2. Relaxation Preparation
      * Close your eyes and take several deep breaths.
      * Perform a brief body scan, relaxing any areas of tension.
      * Continue breathing slowly and deeply to enter a relaxed state.

      #### 3. Choose Your Visualization
      Decide which type of visualization you want to practice:
      * **Peaceful Scene**: Imagining a calming environment
      * **Goal Achievement**: Visualizing successfully accomplishing a specific goal
      * **Healing**: Imagining healing energy moving through your body
      * **Problem Solving**: Visualizing creative solutions to challenges
      * **Energy/Chakra**: Visualizing energy centers in the body

      #### 4. Create a Vivid Mental Image
      * Begin forming the visualization in your mind's eye.
      * Engage all your senses to make it vivid:
        - What do you see? (Colors, shapes, movement)
        - What do you hear? (Sounds in the environment)
        - What do you feel? (Textures, temperature, physical sensations)
        - What do you smell? (Scents in the air)
        - What do you taste? (If relevant to your visualization)

      #### 5. Immerse Yourself Fully
      * Allow yourself to be fully present in the visualization.
      * Interact with the environment you've created.
      * Notice details and allow the scene to unfold naturally.

      #### 6. Incorporate Positive Emotions
      * Feel the emotions associated with your visualization.
      * For a peaceful scene, feel the calm and tranquility.
      * For goal achievement, experience the joy and satisfaction of success.

      #### 7. Add Affirmations (Optional)
      * You can enhance your visualization with positive statements.
      * These should be present tense, positive, and personal.
      * Example: "I am calm and confident during my presentation."

      #### 8. Anchor the Experience
      * Before ending, create a mental anchor (like touching thumb and finger together).
      * This can help you recall the feelings of your visualization later.

      #### 9. Return Gently
      * Gradually bring your awareness back to your physical surroundings.
      * Take a few deep breaths and wiggle your fingers and toes.
      * Open your eyes when ready.

      ### Specific Visualization Examples:

      #### For Relaxation (Peaceful Scene):
      * Imagine yourself on a peaceful beach, forest, or mountain top.
      * Notice the colors, sounds, and sensations of this place.
      * Feel the stress leaving your body as you explore this sanctuary.

      #### For Goal Achievement:
      * See yourself successfully completing your goal in detail.
      * Visualize each step of the process going smoothly.
      * Experience the emotions of accomplishment and satisfaction.

      #### For Healing:
      * Visualize healing light or energy entering your body.
      * See this energy flowing to areas that need healing.
      * Imagine cells becoming healthy and strong.

      ### Tips:
      * Start with 5-10 minute sessions and gradually increase duration.
      * If you struggle with visualization, start with simple objects and build up.
      * Regular practice improves your visualization ability.
      * It's normal for the mind to wander; gently return to your visualization when this happens.
      * Consider recording your own guided visualization or using pre-recorded ones.
    `,
  },

  sleep: {
    name: "Sleep Meditation",
    description:
      "Specifically designed to prepare the mind and body for sleep by inducing deep relaxation.",
    benefits: [
      "Reduces insomnia",
      "Improves sleep quality",
      "Decreases time to fall asleep",
      "Reduces nighttime awakenings",
      "Creates healthy sleep routines",
    ],
    suitableFor: [
      "those with sleep difficulties",
      "people with racing thoughts at bedtime",
      "individuals with anxiety affecting sleep",
      "those wanting to improve sleep quality",
    ],
    guide: `
      ### Steps to Practice Sleep Meditation

      #### 1. Create a Sleep-Conducive Environment
      * Dim the lights in your bedroom at least 30 minutes before bedtime.
      * Ensure your room is at a comfortable temperature.
      * Reduce noise or use white noise if helpful.
      * Put away electronic devices.

      #### 2. Find a Comfortable Position
      * Lie down in your bed in a position you naturally sleep in.
      * Use pillows to support your body as needed.
      * Make any adjustments needed for comfort.

      #### 3. Begin with Conscious Breathing
      * Place one hand on your abdomen.
      * Take slow, deep breaths, feeling your abdomen rise and fall.
      * Gradually allow your breath to find its natural rhythm.

      #### 4. Body Relaxation Scan
      * Starting at your toes, bring awareness to each part of your body.
      * With each exhale, mentally tell that body part to relax and release tension.
      * Slowly move up through your entire body: feet, legs, hips, abdomen, chest, hands, arms, shoulders, neck, and face.

      #### 5. Let Go of the Day
      * Acknowledge any thoughts about the day.
      * Imagine placing these thoughts in a container to be addressed tomorrow.
      * Give yourself permission to rest now.

      #### 6. Use Sleep Visualization
      * Visualize yourself in a peaceful, safe place.
      * It might be a cloud, a boat gently rocking, or a hammock.
      * Feel yourself getting heavier and more relaxed in this safe place.

      #### 7. Counting Down
      * If helpful, count backwards slowly from 100.
      * Visualize each number fading away as you get sleepier.
      * Don't worry if you lose count – that's actually a sign it's working.

      #### 8. Let Go of the Practice
      * There's no need to finish the meditation.
      * Allow yourself to drift into sleep whenever it comes.
      * If you're still awake after 20-30 minutes, you can repeat the process.

      ### Tips:
      * Practice this meditation consistently as part of your bedtime routine.
      * If you wake during the night, you can use parts of this practice to help you fall back asleep.
      * Don't worry about "doing it right" – the goal is relaxation, not perfection.
      * If you're still unable to sleep, don't force it – get up briefly, do something calming, then try again.
      * Consider recording these instructions at a slow pace to guide yourself, or use a sleep meditation app.
    `,
  },

  relaxation: {
    name: "Relaxation Meditation",
    description:
      "Focuses on releasing tension and creating deep relaxation in the body and mind.",
    benefits: [
      "Reduces physical tension",
      "Decreases stress hormones",
      "Lowers blood pressure",
      "Creates mental calm",
      "Improves stress management",
    ],
    suitableFor: [
      "high-stress individuals",
      "those with tension-related pain",
      "people seeking quick stress relief",
      "those new to meditation",
      "people with busy schedules needing breaks",
    ],
    guide: `
      ### Steps to Practice Relaxation Meditation

      #### 1. Find a Comfortable Space
      * Choose a quiet place where you won't be disturbed.
      * Sit in a comfortable chair or lie down.
      * Support your body with cushions as needed.
      * Loosen any tight clothing.

      #### 2. Set a Timeframe
      * Decide how long you'll practice – even 5 minutes can be beneficial.
      * Set a gentle timer if needed.

      #### 3. Begin with Deep Breathing
      * Place one hand on your chest and one on your abdomen.
      * Inhale slowly through your nose for a count of 4.
      * Feel your abdomen expand more than your chest.
      * Exhale slowly through your mouth for a count of 6.
      * Repeat this pattern for 1-2 minutes.

      #### 4. Progressive Muscle Relaxation
      * Working from your feet to your head, tense each muscle group for 5 seconds.
      * Release suddenly and notice the feeling of relaxation.
      * Pay attention to the difference between tension and relaxation.
      * Move through major muscle groups: feet, legs, buttocks, abdomen, chest, hands, arms, shoulders, neck, and face.

      #### 5. Body Awareness
      * Now scan your body without tensing.
      * Notice any remaining areas of tension.
      * Breathe into these areas, imagining the tension dissolving with each exhale.

      #### 6. Relaxing Visualization
      * Imagine yourself in a peaceful, safe place.
      * Engage all your senses in this visualization.
      * Feel the relaxation deepening as you explore this mental sanctuary.

      #### 7. Mindful Rest
      * Simply rest in awareness for a few minutes.
      * There's nothing to do or accomplish.
      * Just be present with the sensations of relaxation.

      #### 8. Gentle Return
      * When ready, deepen your breath slightly.
      * Wiggle your fingers and toes.
      * Stretch gently if you wish.
      * Open your eyes and return your awareness to the room.

      ### Quick Relaxation Techniques (1-2 minutes):

      #### Breath-Based Quick Relaxation
      * Take 5 deep belly breaths, extending the exhale.
      * With each exhale, mentally repeat "relax" or "let go."
      * Feel your shoulders drop with each breath.

      #### 5-4-3-2-1 Sensory Grounding
      * Notice 5 things you can see
      * Notice 4 things you can feel
      * Notice 3 things you can hear
      * Notice 2 things you can smell (or like to smell)
      * Notice 1 thing you can taste (or like to taste)
      * This technique both relaxes and grounds you in the present moment.

      ### Tips:
      * Practice regularly for cumulative benefits.
      * Use quick techniques throughout your day as needed.
      * Record the instructions to guide yourself if helpful.
      * Remember that relaxation is a skill that improves with practice.
    `,
  },

  emotional: {
    name: "Emotional Awareness Meditation",
    description:
      "Focuses on acknowledging and working with specific emotions, developing emotional intelligence and regulation.",
    benefits: [
      "Improves emotional regulation",
      "Develops emotional awareness",
      "Reduces emotional reactivity",
      "Builds emotional resilience",
      "Promotes self-compassion",
    ],
    suitableFor: [
      "those experiencing difficult emotions",
      "people wanting to build emotional intelligence",
      "individuals processing grief or change",
      "those who tend to suppress emotions",
      "anyone seeking better relationships",
    ],
    guide: `
      ### Steps to Practice Emotional Awareness Meditation

      #### 1. Create a Safe Space
      * Find a quiet place where you can be undisturbed.
      * Sit comfortably with your back supported.
      * Remind yourself that all emotions are welcome in this practice.

      #### 2. Center with Breath
      * Take several deep breaths to center yourself.
      * Feel your body grounding to the earth beneath you.
      * Establish a sense of stability before proceeding.

      #### 3. Identify Your Current Emotional State
      * Bring awareness to how you're feeling right now.
      * Notice any emotions present without trying to change them.
      * It's okay if you're not sure what you're feeling – just note the uncertainty.

      #### 4. Locate Emotions in Your Body
      * Scan your body to find where you feel the emotion physically.
      * Common examples:
        - Anxiety might appear as chest tightness or stomach butterflies
        - Sadness might feel heavy in the chest or throat
        - Anger might feel hot in the face or tight in the jaw
      * Simply note these physical sensations with curiosity.

      #### 5. Meet the Emotion with Acknowledgment
      * Mentally name the emotion: "I notice feeling [emotion]."
      * Avoid judging the emotion as good or bad.
      * Remember that emotions are temporary visitors, not permanent states.

      #### 6. Explore with Gentle Questions
      Ask yourself:
      * "What is this emotion trying to tell me?"
      * "What does this emotion need right now?"
      * "What triggered this feeling?"
      
      Don't force answers – just create space for insight to arise.

      #### 7. Respond with Self-Compassion
      * Place a hand on your heart if that feels supportive.
      * Offer yourself kind words like:
        - "This is difficult, and that's okay."
        - "Many people feel this way sometimes."
        - "May I be kind to myself in this moment."

      #### 8. Allow the Emotion to Be
      * Give the emotion space to exist without trying to fix or change it.
      * Notice if it shifts, intensifies, or diminishes as you observe it.
      * Practice being present with the feeling for a few minutes.

      #### 9. Close with Integration
      * Take a few deep breaths.
      * Acknowledge yourself for being present with your emotions.
      * Set an intention to carry this awareness forward into your day.

      ### For Specific Emotions:

      #### For Anxiety:
      * Focus on grounding sensations like your feet on the floor.
      * Use the breath to activate the parasympathetic nervous system.
      * Remind yourself: "I am safe in this moment."

      #### For Anger:
      * Notice the energy of anger without acting on it.
      * Explore what important value might have been violated.
      * Ask: "What needs protection or attention here?"

      #### For Sadness:
      * Allow tears if they come naturally.
      * Place a hand on the area that feels most affected.
      * Consider what loss or disappointment might need acknowledgment.

      #### For Joy/Gratitude:
      * Fully savor the positive emotion.
      * Notice any resistance to feeling good.
      * Take mental notes about what generates positive feelings.

      ### Tips:
      * Start with 10-15 minute sessions.
      * This practice gets easier with time – be patient with yourself.
      * Use a journal after practice to record insights.
      * Remember there are no "bad" emotions – all emotions provide information.
      * If emotions feel overwhelming, return to breath focus or seek support.
    `,
  },
};

// Define the assessment questions to determine the most suitable meditation type
const assessmentQuestions = [
  {
    id: "experience",
    question: "Have you practiced meditation before?",
    options: [
      { text: "Never - I'm completely new to meditation", value: "beginner" },
      { text: "A few times, but not regularly", value: "novice" },
      { text: "Yes, I meditate occasionally", value: "intermediate" },
      { text: "Yes, I have a regular practice", value: "experienced" },
    ],
  },
  {
    id: "goal",
    question: "What's your primary goal with meditation?",
    options: [
      { text: "Reduce stress and anxiety", value: "stress_reduction" },
      { text: "Improve focus and concentration", value: "focus" },
      { text: "Improve sleep quality", value: "sleep" },
      { text: "Develop spiritual connection", value: "spiritual" },
      { text: "Process emotions better", value: "emotional" },
      { text: "Physical relaxation", value: "relaxation" },
    ],
  },
  {
    id: "style",
    question: "Which of these sounds most appealing to you?",
    options: [
      {
        text: "Sitting quietly and watching my thoughts",
        value: "mindfulness",
      },
      { text: "Using a word or phrase repeated mentally", value: "mantra" },
      {
        text: "Moving meditation like walking or gentle yoga",
        value: "movement",
      },
      {
        text: "Visualizing peaceful scenes or healing energy",
        value: "visualization",
      },
      {
        text: "Developing feelings of compassion for myself and others",
        value: "loving_kindness",
      },
      { text: "Systematically relaxing my body", value: "progressive" },
    ],
  },
  {
    id: "time",
    question: "How much time can you dedicate to meditation daily?",
    options: [
      { text: "5 minutes or less", value: "very_short" },
      { text: "5-10 minutes", value: "short" },
      { text: "10-20 minutes", value: "medium" },
      { text: "20+ minutes", value: "long" },
    ],
  },
  {
    id: "challenge",
    question:
      "What do you find most challenging about meditation or what concerns you most?",
    options: [
      { text: "My mind is too busy/I can't stop thinking", value: "busy_mind" },
      {
        text: "I get physically uncomfortable or restless",
        value: "physical_discomfort",
      },
      { text: "I'm not sure if I'm doing it correctly", value: "uncertainty" },
      { text: "I fall asleep or get too drowsy", value: "drowsiness" },
      { text: "I don't have enough time", value: "time_constraint" },
      { text: "I'm not sure what the benefits are", value: "skeptical" },
    ],
  },
];


module.exports = { meditationTypes, assessmentQuestions };
