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
      {
        name: "Vipassana Meditation",
        description:
          "An ancient technique focused on seeing things as they really are through self-observation and awareness of bodily sensations to gain insight and wisdom.",
        howToPractice:
          "The practitioner begins with breath awareness (Anapana) to calm the mind, then performs a systematic body scan, observing physical sensations from head to toe while maintaining equanimity towards all experiences.",
        benefits:
          "* Develops deep self-awareness\n* Promotes mental purification\n* Reduces reactivity to experiences\n* Cultivates equanimity\n* Leads to profound insight and wisdom",
        recommendedFor:
          "Those seeking deeper spiritual insights, individuals looking for transformative practice, and people with some meditation experience who are interested in Buddhist practices.",
        recommendedDuration:
          "Daily practice of 30-60 minutes is recommended, with longer intensive retreats periodically for deeper experience.",
        imageUrl: "/images/meditation/vipassana.jpg",
        videoUrl: "/videos/meditation/vipassana-guide.mp4",
        additionalInfo: {
          origins: "Ancient Buddhist tradition, particularly Theravada Buddhism",
          retreats: "Traditionally taught in 10-day silent retreats",
          teachingCenters: "Offered freely at Dhamma centers worldwide",
          keyPrinciples: ["Anicca (impermanence)", "Observation without reaction", "Systematic approach"]
        },
        order: 5,
      },
      {
        name: "Focused Meditation",
        description:
          "Involves concentration using any of the five senses to focus attention on a single point or object, helping to develop mental discipline and clarity.",
        howToPractice:
          "The practitioner selects a focus object (candle flame, sound, breath, sensation, etc.), then directs full attention to this object, gently returning focus whenever the mind wanders.",
        benefits:
          "* Improves concentration\n* Reduces mental chatter\n* Enhances clarity of thought\n* Builds mental discipline\n* Develops present moment awareness",
        recommendedFor:
          "People with racing thoughts, those who struggle with concentration, analytical minds, and those who prefer structure in their meditation practice.",
        recommendedDuration:
          "Start with 5-10 minutes and gradually increase to 20 minutes as concentration improves.",
        imageUrl: "/images/meditation/focused.jpg",
        videoUrl: "/videos/meditation/focused-guide.mp4",
        additionalInfo: {
          origins: "Elements found in many traditions, including Buddhist and Hindu practices",
          focusObjects: [
            "Visual (candle flame, mandala, yantra)",
            "Auditory (mantra, music, gong)",
            "Tactile (mala beads, breath sensations)",
            "Internal (energy centers, visualization)"
          ],
          progressionPath: "Often leads to deeper states of concentration (samadhi)"
        },
        order: 6,
      },
      {
        name: "Movement Meditation",
        description:
          "Uses physical movement as the focus of meditation, combining mindfulness with motion to develop awareness, particularly helpful for those who find stillness challenging.",
        howToPractice:
          "Choose a form of mindful movement (walking, yoga, tai chi, qigong), move slowly and deliberately while maintaining present-moment awareness of bodily sensations, breath, and the environment.",
        benefits:
          "* Combines physical and mental benefits\n* Increases body awareness\n* Improves coordination\n* Reduces physical tension\n* Accessible for those who struggle with stillness",
        recommendedFor:
          "People with high energy levels, those who struggle with sitting still, individuals who enjoy physical activity, and those seeking a stronger body-mind connection.",
        recommendedDuration:
          "20-30 minutes per session, though even 5-10 minutes of mindful movement can be beneficial.",
        imageUrl: "/images/meditation/movement.jpg",
        videoUrl: "/videos/meditation/movement-guide.mp4",
        additionalInfo: {
          origins: "Found in various traditions: Buddhist walking meditation, Taoist tai chi, Hindu yoga",
          popularForms: ["Walking meditation", "Yoga", "Tai Chi", "Qigong", "Free-form dance"],
          keyAspects: "Coordination of movement with breath, presence, and intentionality"
        },
        order: 7,
      },
      {
        name: "Mantra Meditation",
        description:
          "Uses a repetitive sound, word, or phrase to clear the mind and maintain focus, creating helpful vibrations that aid concentration and spiritual connection.",
        howToPractice:
          "Choose a mantra that resonates with you, sit comfortably, and repeat the mantra aloud, then in a whisper, and finally mentally, allowing it to become subtler as your meditation deepens.",
        benefits:
          "* Creates beneficial sound vibrations\n* Provides a strong focus point\n* Reduces distracting thoughts\n* Helps achieve deeper states of consciousness\n* Can be energizing or calming depending on the mantra",
        recommendedFor:
          "Those who enjoy repetition, people who dislike silence, those who respond well to auditory input, and beginners who struggle with mind-wandering.",
        recommendedDuration:
          "15-30 minutes daily, though benefits can be felt even with 5-10 minutes of practice.",
        imageUrl: "/images/meditation/mantra.jpg",
        videoUrl: "/videos/meditation/mantra-guide.mp4",
        additionalInfo: {
          origins: "Prominent in Hindu and Buddhist traditions, particularly Transcendental Meditation, Yoga, and Tibetan Buddhism",
          popularMantras: ["Om", "So Hum", "Om Namah Shivaya", "Om Mani Padme Hum", "Sat Nam"],
          scientificNotes: "Research shows specific sounds may affect brainwaves and neurological function",
          modern: "Contemporary practitioners may use affirmations or personally meaningful phrases as mantras"
        },
        order: 8,
      },
      {
        name: "Transcendental Meditation",
        description:
          "A specific form of mantra meditation taught by certified instructors that uses a personally assigned mantra practiced twice daily for stress reduction and wellbeing.",
        howToPractice:
          "After learning from a certified TM teacher who provides a personal mantra, practice for 20 minutes twice daily while sitting comfortably with eyes closed, using the mantra effortlessly without concentration.",
        benefits:
          "* Reduces stress and anxiety\n* Improves cardiovascular health\n* Enhances brain function\n* Develops deeper states of relaxation\n* Has been extensively researched",
        recommendedFor:
          "Those seeking an evidence-based practice, people willing to follow a structured approach, those looking for a twice-daily practice, and individuals seeking stress reduction.",
        recommendedDuration:
          "Exactly 20 minutes, twice daily (morning and evening).",
        imageUrl: "/images/meditation/tm.jpg",
        videoUrl: "/videos/meditation/tm-overview.mp4",
        additionalInfo: {
          origins: "Developed by Maharishi Mahesh Yogi in the 1950s, based on Vedic tradition",
          scientificResearch: "One of the most researched meditation techniques with over 400 published studies",
          teachingMethod: "Only taught by certified TM instructors through a standardized course",
          celebrities: "Popularized by practitioners including The Beatles, David Lynch, and Oprah Winfrey"
        },
        order: 9,
      },
      {
        name: "Progressive Relaxation Meditation",
        description:
          "A practice that involves systematically tensing and relaxing different muscle groups to induce physical and mental relaxation and release chronic tension.",
        howToPractice:
          "Lie down comfortably, then work through each muscle group from toes to head (or head to toes), tensing each area for 5-10 seconds before suddenly releasing and observing the sensation of relaxation.",
        benefits:
          "* Reduces physical tension\n* Helps identify and release chronic tension\n* Improves body awareness\n* Reduces anxiety symptoms\n* Aids in falling asleep",
        recommendedFor:
          "Those with physical tension or pain, people with anxiety, those with sleep difficulties, beginners to meditation, and people who prefer a tangible, physical focus.",
        recommendedDuration:
          "15-20 minutes per session, ideal before bedtime or during breaks from work.",
        imageUrl: "/images/meditation/progressive-relaxation.jpg",
        videoUrl: "/videos/meditation/progressive-relaxation-guide.mp4",
        additionalInfo: {
          origins: "Developed by Dr. Edmund Jacobson in the 1920s as a medical relaxation technique",
          variations: ["Body scan without tension", "Autogenic training", "Cue-controlled relaxation"],
          clinicalUses: "Widely used in clinical settings for anxiety, insomnia, and stress-related conditions",
          combination: "Often combined with visualization or breathing techniques for enhanced effects"
        },
        order: 10,
      },
      {
        name: "Spiritual Meditation",
        description:
          "A practice focused on developing a deeper connection with a higher power or the universe, adapted to various religious and spiritual traditions.",
        howToPractice:
          "Create a sacred space, sit comfortably, center yourself with breath, focus on your heart center, then connect through prayer, contemplation of sacred texts, visualization of divine presence, or silent listening for guidance.",
        benefits:
          "* Deepens spiritual connection\n* Fosters sense of meaning and purpose\n* Promotes feelings of gratitude\n* Increases compassion\n* Creates sense of peace and connectedness",
        recommendedFor:
          "Those on a spiritual path, people seeking meaning and purpose, individuals from various faith traditions, and those seeking connection beyond the self.",
        recommendedDuration:
          "15-30 minutes daily, though some traditions recommend longer periods for deeper practices.",
        imageUrl: "/images/meditation/spiritual.jpg",
        videoUrl: "/videos/meditation/spiritual-guide.mp4",
        additionalInfo: {
          origins: "Found in virtually all religious and spiritual traditions worldwide",
          variations: [
            "Christian contemplative prayer and centering prayer",
            "Islamic Sufi dhikr",
            "Jewish Kabbalistic meditation",
            "Hindu devotional practices",
            "Buddhist loving-kindness"
          ],
          sacred: "Often incorporates sacred objects, texts, or environments",
          communal: "May be practiced individually or in communal settings"
        },
        order: 11,
      },
      {
        name: "Visualization Meditation",
        description:
          "Uses mental imagery to promote relaxation, healing, or achieving specific goals by engaging the mind's creative and imaginative faculties.",
        howToPractice:
          "Sit or recline comfortably, relax your body through breath, choose a visualization focus (peaceful scene, goal achievement, healing, etc.), create a vivid mental image using all senses, and immerse yourself fully in the experience.",
        benefits:
          "* Reduces stress and anxiety\n* Helps rehearse successful outcomes\n* Can promote healing and pain reduction\n* Enhances creativity\n* Improves sports and performance skills",
        recommendedFor:
          "Creative individuals, those with specific goals, people seeking healing, visual thinkers, and those preparing for performances or events.",
        recommendedDuration:
          "10-15 minutes daily, though longer sessions may be beneficial for complex visualizations.",
        imageUrl: "/images/meditation/visualization.jpg",
        videoUrl: "/videos/meditation/visualization-guide.mp4",
        additionalInfo: {
          origins: "Elements found in shamanic traditions, Buddhist practices, and modern psychology",
          applications: ["Sports psychology", "Pain management", "Healing practices", "Performance enhancement"],
          techniques: ["Guided imagery", "Future self", "Mental rehearsal", "Healing light visualization"],
          research: "Studies show visualization activates similar brain patterns as physical performance"
        },
        order: 12,
      },
      {
        name: "Sleep Meditation",
        description:
          "Specifically designed to prepare the mind and body for sleep by inducing deep relaxation and addressing factors that interfere with falling asleep.",
        howToPractice:
          "Create a sleep-conducive environment, lie in a comfortable position, begin with conscious breathing, perform a relaxing body scan, let go of thoughts about the day, use soothing visualizations, and allow yourself to drift into sleep.",
        benefits:
          "* Reduces insomnia\n* Improves sleep quality\n* Decreases time to fall asleep\n* Reduces nighttime awakenings\n* Creates healthy sleep routines",
        recommendedFor:
          "Those with sleep difficulties, people with racing thoughts at bedtime, individuals with anxiety affecting sleep, and those wanting to improve overall sleep quality.",
        recommendedDuration:
          "15-20 minutes, practiced while in bed preparing to sleep, with no need to complete the practice before falling asleep.",
        imageUrl: "/images/meditation/sleep.jpg",
        videoUrl: "/videos/meditation/sleep-guide.mp4",
        additionalInfo: {
          origins: "Combines elements from multiple relaxation traditions with sleep science",
          bestPractices: "Part of good sleep hygiene; most effective when combined with consistent sleep schedule",
          techniques: ["Body scan", "Visualization", "Breathing techniques", "Gentle counting", "Gratitude practice"],
          scienceBackground: "Works by activating parasympathetic nervous system and reducing cognitive arousal"
        },
        order: 13,
      },
      {
        name: "Relaxation Meditation",
        description:
          "Focuses on releasing tension and creating deep relaxation in the body and mind through various techniques designed to activate the relaxation response.",
        howToPractice:
          "Find a comfortable space, begin with deep diaphragmatic breathing, practice progressive muscle relaxation, scan for remaining tension, use peaceful visualization, rest in awareness, and gradually return to normal activity.",
        benefits:
          "* Reduces physical tension\n* Decreases stress hormones\n* Lowers blood pressure\n* Creates mental calm\n* Improves stress management",
        recommendedFor:
          "High-stress individuals, those with tension-related pain, people seeking quick stress relief, those new to meditation, and people with busy schedules needing breaks.",
        recommendedDuration:
          "5-20 minutes as needed throughout the day, with even brief 1-2 minute practices offering benefits.",
        imageUrl: "/images/meditation/relaxation.jpg",
        videoUrl: "/videos/meditation/relaxation-guide.mp4",
        additionalInfo: {
          origins: "Derived from various traditions and modern stress reduction techniques",
          science: "Based on Dr. Herbert Benson's 'Relaxation Response' research",
          quickTechniques: ["4-7-8 breathing", "Body scan", "5-4-3-2-1 sensory grounding"],
          applications: "Useful before stressful events, during work breaks, and in managing acute stress"
        },
        order: 14,
      },
      {
        name: "Emotional Awareness Meditation",
        description:
          "Focuses on acknowledging and working with specific emotions, developing emotional intelligence and regulation through mindful awareness.",
        howToPractice:
          "Create a safe space, center with breath, identify current emotions, locate where they manifest in your body, acknowledge without judgment, explore with gentle curiosity, respond with self-compassion, and allow emotions to be present without trying to change them.",
        benefits:
          "* Improves emotional regulation\n* Develops emotional awareness\n* Reduces emotional reactivity\n* Builds emotional resilience\n* Promotes self-compassion",
        recommendedFor:
          "Those experiencing difficult emotions, people wanting to build emotional intelligence, individuals processing grief or change, those who tend to suppress emotions, and anyone seeking better relationships.",
        recommendedDuration:
          "10-15 minutes daily, with additional brief practice during emotionally challenging moments.",
        imageUrl: "/images/meditation/emotional-awareness.jpg",
        videoUrl: "/videos/meditation/emotional-awareness-guide.mp4",
        additionalInfo: {
          origins: "Combines mindfulness with aspects of modern psychology and emotional intelligence",
          techniques: ["RAIN practice (Recognize, Allow, Investigate, Nurture)", "Emotion naming", "Body-centered inquiry"],
          therapyConnections: "Often used in mindfulness-based therapy approaches like DBT and ACT",
          journaling: "Can be enhanced by reflective journaling after practice"
        },
        order: 15,
      }
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