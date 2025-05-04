// src/pages/MeditationType.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const MeditationType = () => {
  const { id } = useParams();
  const [meditationType, setMeditationType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("about");
  const { user } = useAuth();

  // the useEffect
  useEffect(() => {
    const fetchMeditationType = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/meditation-types/${id}`);

        // Check if the API returned success
        if (response.data.success) {
          // The meditation type is in the data property
          setMeditationType(response.data.data);
          setError(null);
        } else {
          setError(response.data.message || "Failed to load meditation type");
        }
      } catch (err) {
        console.error("Error fetching meditation type:", err);
        setError(
          "Failed to load this meditation type. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMeditationType();
  }, [id]);

  // Parse benefits from string to array
  const parseBenefits = (benefitsText) => {
    if (!benefitsText) return [];
    if (Array.isArray(benefitsText)) return benefitsText;

    // If benefits is a string with bullet points (* item), split it into an array
    return benefitsText
      .split("\n")
      .map((item) => item.replace(/^\* /, "").trim())
      .filter((item) => item.length > 0);
  };

  // Parse recommendedFor from string to array if needed
  const parseRecommendedFor = (text) => {
    if (!text) return [];
    if (Array.isArray(text)) return text;

    // If it's a single string, return it as a one-item array
    if (typeof text === "string" && !text.includes("\n")) {
      return [text];
    }

    // If it's a multi-line string, split it
    return text
      .split("\n")
      .map((item) => item.replace(/^\* /, "").trim())
      .filter((item) => item.length > 0);
  };

  // Function to render markdown content
  const renderMarkdown = (content) => {
    // This is a simple markdown parser - for production you might want to use a library like marked or react-markdown
    if (!content) return null;

    // If howToPractice is a simple string, display it directly
    if (typeof content === "string" && !content.includes("####")) {
      return (
        <div className="text-gray-600 space-y-2">
          {content.split("\n").map((paragraph, i) => {
            // Check if it's a list item
            if (paragraph.trim().startsWith("* ")) {
              return (
                <div key={i} className="flex items-start ml-2">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>{paragraph.replace("* ", "")}</span>
                </div>
              );
            }
            return <p key={i}>{paragraph}</p>;
          })}
        </div>
      );
    }

    // For more structured content with sections
    const sections = content.split("#### ").filter(Boolean);
    return sections.map((section, index) => {
      const [title, ...contentParts] = section.split("\n").filter(Boolean);
      const sectionContent = contentParts.join("\n");

      return (
        <div key={index} className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">{title}</h4>
          <div className="text-gray-600 space-y-2">
            {sectionContent.split("\n").map((paragraph, i) => {
              // Check if it's a list item
              if (paragraph.trim().startsWith("* ")) {
                return (
                  <div key={i} className="flex items-start ml-2">
                    <span className="text-indigo-500 mr-2">•</span>
                    <span>{paragraph.replace("* ", "")}</span>
                  </div>
                );
              }
              return <p key={i}>{paragraph}</p>;
            })}
          </div>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-indigo-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600">Loading meditation details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-indigo-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link
            to="/explore"
            className="inline-block px-5 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  if (!meditationType) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-indigo-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Meditation Type Not Found
          </h2>
          <p className="text-gray-700 mb-6">
            The meditation type you're looking for could not be found.
          </p>
          <Link
            to="/explore"
            className="inline-block px-5 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  // Parse the data from our API response
  const benefits = parseBenefits(meditationType.benefits);
  const recommendedFor = parseRecommendedFor(meditationType.recommendedFor);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Back to Explore */}
        <Link
          to="/explore"
          className="inline-flex items-center text-indigo-600 hover:text-indigo-800 mb-6"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Explore
        </Link>

        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="h-2 bg-indigo-600"></div>
          <div className="p-8">
            <h1 className="text-3xl font-serif text-gray-900 mb-4">
              {meditationType.name}
            </h1>
            <p className="text-xl text-gray-600 mb-6">
              {meditationType.description}
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                  Recommended For
                </h3>
                <p className="text-gray-700">
                  {recommendedFor && recommendedFor.length > 0
                    ? recommendedFor[0]
                    : "Everyone"}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                  Typical Duration
                </h3>
                <p className="text-gray-700">
                  {meditationType.recommendedDuration || "5-20 minutes"}
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                  Experience Level
                </h3>
                <p className="text-gray-700">
                  {meditationType.additionalInfo?.difficultyLevel ||
                    "Suitable for all levels"}
                </p>
              </div>
            </div>

            {/* Start Meditation Button */}
            <div className="flex justify-center mb-4">
              <Link
                to={user ? `/meditation/session/${id}` : "/login"}
                className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors text-center"
              >
                {user ? "Start Meditation" : "Login to Begin"}
              </Link>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-12">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveSection("about")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeSection === "about"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                About This Practice
              </button>
              <button
                onClick={() => setActiveSection("benefits")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeSection === "benefits"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Benefits
              </button>
              <button
                onClick={() => setActiveSection("howto")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeSection === "howto"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                How to Practice
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeSection === "about" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  About {meditationType.name}
                </h2>
                <div className="text-gray-600 space-y-4 mb-6">
                  <p>{meditationType.description}</p>
                  {meditationType.additionalInfo?.origins && (
                    <p>
                      <strong>Origins: </strong>
                      {meditationType.additionalInfo.origins}
                    </p>
                  )}
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-3">
                  Who is this practice for?
                </h3>
                <ul className="text-gray-600 space-y-2 mb-6">
                  {recommendedFor &&
                    recommendedFor.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-indigo-500 mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                </ul>

                {meditationType.additionalInfo?.relatedStyles && (
                  <>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      Related Styles
                    </h3>
                    <ul className="text-gray-600 space-y-2 mb-6">
                      {meditationType.additionalInfo.relatedStyles.map(
                        (style, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-indigo-500 mr-2">•</span>
                            <span>{style}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </>
                )}
              </div>
            )}

            {activeSection === "benefits" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Benefits of {meditationType.name}
                </h2>
                <p className="text-gray-600 mb-6">
                  Regular practice of {meditationType.name} has been shown to
                  provide the following benefits:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefits &&
                    benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-start bg-indigo-50 p-4 rounded-lg"
                      >
                        <span className="text-indigo-600 mr-3">
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                        <span className="text-gray-700">{benefit}</span>
                      </div>
                    ))}
                </div>

                {meditationType.additionalInfo?.scientificStudies && (
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      Scientific Research
                    </h3>
                    <ul className="text-gray-600 space-y-4">
                      {meditationType.additionalInfo.scientificStudies.map(
                        (study, index) => (
                          <li key={index} className="bg-blue-50 p-4 rounded-lg">
                            <p className="font-medium">{study.title}</p>
                            <p className="text-sm">
                              {study.authors} ({study.year}) - {study.journal}
                            </p>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeSection === "howto" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  How to Practice {meditationType.name}
                </h2>
                <p className="text-gray-600 mb-6">
                  Follow these steps to establish your {meditationType.name}{" "}
                  practice:
                </p>

                <div className="bg-indigo-50 p-6 rounded-lg mb-8">
                  {renderMarkdown(
                    meditationType.howToPractice || meditationType.guide
                  )}
                </div>

                {/* {meditationType.additionalInfo?.popularApps && (
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      Recommended Apps
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {meditationType.additionalInfo.popularApps.map(
                        (app, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full"
                          >
                            {app}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )} */}

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Remember that meditation is a practice. Be patient with
                        yourself and try to maintain consistency rather than
                        perfection.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        {!user && (
          <div className="bg-indigo-600 text-white rounded-xl shadow-md overflow-hidden">
            <div className="p-8 text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Ready to Begin Your Practice?
              </h2>
              <p className="mb-6 max-w-2xl mx-auto">
                Join our community to track your progress, save favorite
                meditations, and access guided sessions.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link
                  to="/signup"
                  className="px-6 py-3 bg-white text-indigo-700 rounded-md hover:bg-indigo-50 transition-colors"
                >
                  Sign Up Free
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 bg-indigo-700 text-white rounded-md hover:bg-indigo-800 transition-colors"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeditationType;
