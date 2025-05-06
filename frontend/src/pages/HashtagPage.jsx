// src/pages/HashtagPage.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import StoryCard from "../components/community/storyCard";

const HashtagPage = () => {
  const { hashtag } = useParams();
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetchedCreatedAt, setLastFetchedCreatedAt] = useState(null);

  const observer = useRef();
  const lastStoryElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreStories();
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Fetch stories by hashtag
  useEffect(() => {
    fetchStories();
  }, [hashtag]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/stories/hashtag/${hashtag}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        params: { limit: 10 },
      });

      setStories(response.data.stories);
      setHasMore(response.data.hasMore);
      if (response.data.stories.length > 0) {
        setLastFetchedCreatedAt(
          response.data.stories[response.data.stories.length - 1].createdAt
        );
      }
    } catch (err) {
      console.error("Error fetching stories by hashtag:", err);
      setError("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  const loadMoreStories = async () => {
    if (!hasMore || loading) return;

    try {
      setLoading(true);
      const response = await axios.get(`/api/stories/hashtag/${hashtag}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        params: {
          limit: 10,
          lastFetchedCreatedAt,
        },
      });

      setStories((prev) => [...prev, ...response.data.stories]);
      setHasMore(response.data.hasMore);
      if (response.data.stories.length > 0) {
        setLastFetchedCreatedAt(
          response.data.stories[response.data.stories.length - 1].createdAt
        );
      }
    } catch (err) {
      console.error("Error loading more stories:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryDeleted = (storyId) => {
    setStories((prev) => prev.filter((story) => story.id !== storyId));
  };

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-indigo-700 mb-6">
            Join Our Community
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Log in to view stories and connect with other meditators.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors"
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-8">
          <Link
            to="/community"
            className="mr-4 text-indigo-600 hover:text-indigo-800"
          >
            <svg
              className="w-5 h-5"
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
          </Link>
          <h1 className="text-3xl font-bold text-indigo-700">#{hashtag}</h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Stories Feed */}
        <div className="grid grid-cols-1 gap-6 max-w-2xl mx-auto">
          {stories.length === 0 && !loading ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 mb-2">
                No stories found for #{hashtag}
              </p>
              <p className="text-gray-500">
                Be the first to share a story with this hashtag!
              </p>
              <Link
                to="/community"
                className="inline-block mt-4 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Back to Community
              </Link>
            </div>
          ) : (
            stories.map((story, index) => {
              if (stories.length === index + 1) {
                return (
                  <StoryCard
                    key={story.id}
                    story={story}
                    ref={lastStoryElementRef}
                    onDelete={handleStoryDeleted}
                    currentUser={user}
                  />
                );
              } else {
                return (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onDelete={handleStoryDeleted}
                    currentUser={user}
                  />
                );
              }
            })
          )}

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center p-4">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HashtagPage;
