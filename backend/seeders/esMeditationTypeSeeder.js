// seeders/esMeditationTypeSeeder.js
const {
  saveMeditationType,
  getAllMeditationTypes,
} = require("../utils/esMeditationTypeUtils");
const {
  initializeElasticsearchIndices,
} = require("../models/elasticsearch/initIndices");

// Seed data for meditation types
const seedMeditationTypes = async () => {
  try {
    // Initialize Elasticsearch indices first
    await initializeElasticsearchIndices();

    // Check if there are already meditation types in the index
    const existingTypes = await getAllMeditationTypes();

    if (existingTypes.length > 0) {
      console.log(
        `${existingTypes.length} meditation types already exist in Elasticsearch. Skipping seeding.`
      );
      return;
    }

    // Seed data for meditation types
    const meditationTypes = [
      {
        name: "Mindfulness Meditation",
        description:
          "Mindfulness meditation originates from Buddhist teachings and is the most popular and researched form of meditation in the Western world. It involves paying attention to thoughts as they pass through the mind without judgment or involvement, simply observing and noting patterns.",
        howToPractice:
          "The practitioner sits quietly, focusing on an object or breath while observing bodily sensations, thoughts, and feelings. This practice combines concentration with awareness. The meditator acknowledges thoughts or environmental sensations without engaging or judging, then lets them pass.",
        benefits:
          "* Improves symptoms of stress, anxiety, and depression\n* Lowers high blood pressure\n* Reduces chronic pain\n* Improves sleep quality\n* Changes gray matter in the brain in areas associated with self-awareness, emotion, and cognition",
        recommendedFor:
          "This type is ideal for beginners and those who don't have a teacher to guide them, as it can be easily practiced alone.",
        recommendedDuration:
          'For general benefits, sessions of 5-10 minutes daily are recommended for beginners, gradually increasing to 20 minutes. According to a Zen proverb: "You should sit in meditation for 20 minutes every day - unless you\'re too busy. Then you should sit for an hour"',
        imageUrl: "/images/meditation/mindfulness.jpg",
        videoUrl: "/videos/meditation/mindfulness-guide.mp4",
        additionalInfo: {
          origins: "Buddhist traditions, particularly Vipassana meditation",
          scientificStudies: [
            {
              title:
                "Mindfulness practice leads to increases in regional brain gray matter density",
              authors: "Hölzel et al.",
              year: 2011,
              journal: "Psychiatry Research: Neuroimaging",
            },
          ],
          relatedStyles: [
            "Vipassana",
            "Zen",
            "MBSR (Mindfulness-Based Stress Reduction)",
          ],
          popularApps: ["Headspace", "Calm", "Insight Timer"],
        },
        order: 1,
      },
      {
        name: "Loving-Kindness Meditation",
        description:
          "Loving-kindness meditation (Metta) is a practice derived from Buddhist traditions that focuses on developing attitudes of love, kindness, and compassion toward oneself and others.",
        howToPractice:
          'The practitioner sits comfortably and begins by directing positive phrases or wishes toward themselves, then progressively extends these wishes to loved ones, neutral individuals, difficult people, and finally to all beings. Common phrases include: "May I be happy. May I be well. May I be safe. May I be peaceful."',
        benefits:
          "* Increases positive emotions and decreases negative emotions\n* Reduces self-criticism\n* Enhances compassion and empathy\n* Decreases symptoms of PTSD\n* Strengthens social connections\n* Reduces implicit bias",
        recommendedFor:
          "Particularly beneficial for those dealing with self-criticism, relationship challenges, anger issues, or those wanting to develop greater compassion.",
        recommendedDuration:
          "Start with 10-15 minutes daily. The effects of this practice tend to build over time, so consistency is more important than session length.",
        imageUrl: "/images/meditation/loving-kindness.jpg",
        videoUrl: "/videos/meditation/loving-kindness-guide.mp4",
        additionalInfo: {
          origins:
            "Buddhist tradition, particularly from the Theravada tradition",
          alternativeNames: ["Metta Meditation", "Benevolence Meditation"],
          traditionalPhrases: [
            "May I be happy. May I be well. May I be safe. May I be peaceful and at ease.",
            "May you be happy. May you be well. May you be safe. May you be peaceful and at ease.",
          ],
          modifications:
            "Can be adapted to focus on specific qualities like forgiveness, gratitude, or equanimity",
        },
        order: 2,
      },
      {
        name: "Body Scan Meditation",
        description:
          "Body scan meditation involves systematically bringing attention to different parts of the body, noticing sensations without trying to change them. It's a form of mindfulness practice that helps develop awareness of bodily sensations.",
        howToPractice:
          "Typically done lying down, the practitioner progressively focuses attention from the toes to the head (or head to toes), noticing sensations in each body part without judgment. The practice might involve tensing and relaxing muscles or simply observing sensations as they are.",
        benefits:
          "* Reduces physical tension and stress\n* Promotes better awareness of mind-body connection\n* Helps with insomnia and sleep issues\n* Reduces pain perception\n* Increases awareness of subtle bodily signals",
        recommendedFor:
          "Excellent for beginners, those with physical tension or pain, and individuals who want to improve their body awareness. Particularly useful for those who find it difficult to sit still during meditation.",
        recommendedDuration:
          "10-20 minutes daily is recommended. Can be practiced before sleep to help with insomnia.",
        imageUrl: "/images/meditation/body-scan.jpg",
        videoUrl: "/videos/meditation/body-scan-guide.mp4",
        additionalInfo: {
          origins:
            "Combines elements from various traditions, popularized by Jon Kabat-Zinn's MBSR program",
          variations: ["Progressive Muscle Relaxation", "Yoga Nidra"],
          bestTimeToPerform:
            "Before sleep or during breaks from extended sitting",
          contraindications:
            "Those with severe trauma may need guidance as body awareness can sometimes trigger trauma responses",
        },
        order: 3,
      },
      {
        name: "Breath Awareness Meditation",
        description:
          "Breath awareness meditation is a fundamental meditation technique that involves focusing attention on the breath. It serves as the foundation for many other meditation practices.",
        howToPractice:
          "Sit in a comfortable position and direct attention to the natural flow of the breath. Notice the sensation of breath entering and leaving the body. When the mind wanders, gently bring attention back to the breath without judgment.",
        benefits:
          "* Reduces stress and anxiety\n* Improves focus and concentration\n* Calms the nervous system\n* Serves as a grounding technique during difficult emotions\n* Helps with emotional regulation",
        recommendedFor:
          "Suitable for all practitioners, especially beginners. An excellent starting point for developing a meditation practice.",
        recommendedDuration:
          "Start with 5 minutes daily and gradually increase to 15-20 minutes as comfort grows with the practice.",
        imageUrl: "/images/meditation/breath.jpg",
        videoUrl: "/videos/meditation/breath-awareness-guide.mp4",
        additionalInfo: {
          origins:
            "Found in most meditation traditions, especially prominent in Buddhist practices",
          focusPoints: [
            "Sensation of air at nostrils",
            "Rising and falling of chest or abdomen",
            "Entire breathing process",
          ],
          countingTechnique:
            "Some practitioners count breaths (1 to 10, then restart) to enhance focus",
          practiceProgression:
            "Often serves as preliminary practice before advancing to other techniques",
        },
        order: 4,
      },
    ];

    // Save each meditation type to Elasticsearch
    for (const type of meditationTypes) {
      await saveMeditationType(type);
      console.log(`Added meditation type: ${type.name}`);
    }

    console.log("Meditation types seeded successfully!");
  } catch (error) {
    console.error("Error seeding meditation types:", error);
  }
};

// Execute the seeder function if this file is run directly
if (require.main === module) {
  seedMeditationTypes()
    .then(() => {
      console.log("Seeding complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}

module.exports = {
  seedMeditationTypes,
};
