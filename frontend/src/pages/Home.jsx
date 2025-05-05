// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { user } = useAuth();
  const [activeStory, setActiveStory] = useState(0);
  const stories = [
    {
      title: "The Buddha and the Flower",
      teacher: "Buddha",
      content:
        'Once, the Buddha silently held up a flower before his assembly. The disciples were puzzled, except for Mahakashyapa, who simply smiled. The Buddha acknowledged him, saying, "I have the True Dharma Eye, the heart of Nirvana, the true form of the formless, and the incomparable teaching of the Dharma. It is not dependent on words but is a special transmission outside the scriptures. This I entrust to Mahakashyapa."',
      moral: "Sometimes, true understanding goes beyond words and concepts.",
      image: "/images/buddha-flower.jpg",
    },
    {
      title: "The Hugging Saint",
      teacher: "Mata Amritanandamayi (Amma)",
      content:
        "Known as Amma, Mata Amritanandamayi has embraced over 33 million people worldwide, offering comfort and unconditional love. She teaches that to achieve absolute bliss, one needs knowledge, action, and devotion. Amma inspires her followers to serve humanity selflessly, believing that helping others is the path to true happiness.",
      moral:
        "Unconditional love and selfless service are the foundation of true happiness.",
      image: "/images/amma.jpg",
    },
    {
      title: "From Darkness to Enlightenment",
      teacher: "Milarepa",
      content:
        "Milarepa, one of Tibet's greatest saints, began life burdened by negative karma and suffering. Through intense meditation, perseverance, and guidance from his teacher Marpa, he transformed himself, attaining spiritual realization.",
      moral:
        "Anyone, no matter their past, can achieve growth and enlightenment with dedication and the right guidance.",
      image: "/images/milarepa.jpg",
    },
    {
      title: "The Voice of Vedanta",
      teacher: "Swami Vivekananda",
      content:
        'Swami Vivekananda brought the philosophies of Yoga and Vedanta to the world stage. At the 1893 Parliament of Religions in Chicago, he began his speech with "Sisters and brothers of America," captivating the audience. He emphasized truth, purity, and unselfishness, urging all to cultivate faith and inner strength.',
      moral:
        "Truth, purity, and unselfishness are the pillars of spiritual strength.",
      image: "/images/vivekananda.jpg",
    },
    {
      title: "Wisdom for Modern Times",
      teacher: "Sadhguru Jaggi Vasudev",
      content:
        "Sadhguru, founder of the Isha Foundation, is known for his practical wisdom and environmental activism. He inspires millions, especially the youth, to embrace yoga and meditation, and to live in harmony with nature.",
      moral:
        "Living in harmony with nature and oneself leads to lasting fulfillment.",
      image: "/images/sadhguru.jpg",
    },
    {
      title: "The Kindness of the Guru",
      teacher: "Tibetan Buddhist Tradition",
      content:
        "In Tibetan Buddhist tradition, the guru is revered as the source of wisdom and compassion. It is said that the kindness of the guru surpasses even that of the buddhas, for the guru teaches, blesses, and inspires disciples to practice, helping them find meaning and happiness in life.",
      moral:
        "A genuine teacher's guidance is invaluable on the spiritual path.",
      image: "/images/guru.jpg",
    },
  ];

  // Navigate to previous story
  const prevStory = () => {
    setActiveStory((prev) => (prev === 0 ? stories.length - 1 : prev - 1));
  };

  // Navigate to next story
  const nextStory = () => {
    setActiveStory((prev) => (prev + 1) % stories.length);
  };

  // Auto-cycle through stories
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStory((prev) => (prev + 1) % stories.length);
    }, 10000); // Change story every 10 seconds

    return () => clearInterval(interval);
  }, [stories.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <svg className="h-full w-full" viewBox="0 0 800 800">
            <circle
              className="text-indigo-100 fill-current"
              cx="400"
              cy="400"
              r="200"
            />
            <circle
              className="text-blue-100 fill-current"
              cx="500"
              cy="300"
              r="150"
            />
            <circle
              className="text-pink-100 fill-current"
              cx="300"
              cy="350"
              r="175"
            />
          </svg>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-light text-indigo-900 leading-tight mb-6">
              Begin Your Journey to Inner Peace
            </h1>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8">
              Meditation is a simple practice that helps us return to the
              present moment, find clarity, and cultivate a sense of peace.
              Whether you're new or experienced, meditation offers a gentle
              space to notice your breath, observe your thoughts, and reconnect
              with yourself.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              {/* <Link
                to="/meditation"
                className="px-8 py-3 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition-colors duration-300"
              >
                Start Meditating
              </Link> */}
              <Link
                to="/explore"
                className="px-8 py-3 bg-white text-indigo-600 border border-indigo-200 rounded-full shadow-sm hover:bg-indigo-50 transition-colors duration-300"
              >
                Explore Techniques
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif text-center text-gray-800 mb-12">
            The Benefits of Regular Practice
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-indigo-50 rounded-lg p-6 text-center transition-transform hover:scale-105 duration-300">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl mx-auto mb-4">
                🧠
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                Mental Clarity
              </h3>
              <p className="text-gray-600">
                Sharpen your focus and reduce mental clutter through regular
                meditation.
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 text-center transition-transform hover:scale-105 duration-300">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-2xl mx-auto mb-4">
                ❤️
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                Emotional Balance
              </h3>
              <p className="text-gray-600">
                Develop resilience and a greater sense of calm in the face of
                life's challenges.
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 text-center transition-transform hover:scale-105 duration-300">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 text-2xl mx-auto mb-4">
                ✨
              </div>
              <h3 className="text-xl font-medium text-gray-800 mb-2">
                Spiritual Growth
              </h3>
              <p className="text-gray-600">
                Connect with your inner self and explore deeper dimensions of
                awareness.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* Wisdom Stories Section */}
      <section className="py-16 bg-gradient-to-b from-white to-indigo-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-serif text-center text-gray-800 mb-4">
            Wisdom from Masters
          </h2>
          <p className="text-center text-gray-600 max-w-2xl mx-auto mb-12">
            Discover timeless insights from spiritual teachers across
            traditions.
          </p>

          {/* Story Carousel */}
          <div className="relative max-w-4xl mx-auto">
            {/* Navigation Buttons */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-5 z-20 hidden md:block">
              <button
                onClick={prevStory}
                className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors"
                aria-label="Previous story"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            </div>

            <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-5 z-20 hidden md:block">
              <button
                onClick={nextStory}
                className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors"
                aria-label="Next story"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-500">
              <div className="md:flex h-full">
                <div className="md:w-1/3 bg-indigo-100 flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white rounded-full text-4xl flex items-center justify-center mx-auto mb-3 shadow-inner">
                      {activeStory === 0
                        ? "🪷"
                        : activeStory === 1
                        ? "🤗"
                        : activeStory === 2
                        ? "🧠"
                        : activeStory === 3
                        ? "🌊"
                        : activeStory === 4
                        ? "🧘"
                        : "🙏"}
                    </div>
                    <h3 className="text-xl font-medium text-indigo-900">
                      {stories[activeStory].teacher}
                    </h3>
                  </div>
                </div>

                {/* Fixed height content area with overflow handling */}
                <div className="md:w-2/3 p-6 md:h-80">
                  <div className="h-full overflow-y-auto pr-2 story-container">
                    <h3 className="text-2xl font-serif text-gray-800 mb-3">
                      {stories[activeStory].title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {stories[activeStory].content}
                    </p>
                    <p className="text-indigo-600 italic font-medium">
                      {stories[activeStory].moral}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Navigation Buttons */}
            <div className="flex justify-between mt-6 md:hidden">
              <button
                onClick={prevStory}
                className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors"
                aria-label="Previous story"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>

              <button
                onClick={nextStory}
                className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors"
                aria-label="Next story"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {/* Story Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {stories.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStory(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                    index === activeStory ? "bg-indigo-600" : "bg-indigo-200"
                  }`}
                  aria-label={`Story ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      {/* Meditation Stats */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-4xl font-light text-indigo-600">1M+</p>
              <p className="text-gray-600">People Meditating</p>
            </div>
            <div>
              <p className="text-4xl font-light text-indigo-600">20+</p>
              <p className="text-gray-600">Meditation Techniques</p>
            </div>
            <div>
              <p className="text-4xl font-light text-indigo-600">5000+</p>
              <p className="text-gray-600">Years of Tradition</p>
            </div>
            <div>
              <p className="text-4xl font-light text-indigo-600">∞</p>
              <p className="text-gray-600">Moments of Peace</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Only visible to non-logged in users */}
      {!user && (
        <section className="py-16 bg-indigo-800 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-serif mb-6">
              Begin Your Practice Today
            </h2>
            <p className="max-w-2xl mx-auto mb-8 text-indigo-100">
              Join our community and discover the transformative power of
              meditation.
            </p>
            <Link
              to="/signup"
              className="inline-block px-8 py-3 bg-white text-indigo-800 rounded-full shadow-md hover:bg-indigo-100 transition-colors duration-300"
            >
              Create Free Account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
