// src/pages/Community.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import StoryCard from "../components/community/storyCard";
import CreateStoryModal from "../components/community/CreateStoryModal";
import { resolveUsersForItems } from "../utils/userResolver";

const Community = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastTimestamp, setLastTimestamp] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const observer = useRef();

  // Function to fetch stories
  const fetchStories = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        let url = "/api/stories?limit=10";
        if (!isInitial && lastTimestamp) {
          url += `&lastTimestamp=${lastTimestamp}`;
        }

        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        const newStories = response.data.stories || [];

        // Resolve usernames for all stories
        const storiesWithUsers = await resolveUsersForItems(newStories);

        if (isInitial) {
          setStories(storiesWithUsers);
        } else {
          setStories((prev) => [...prev, ...storiesWithUsers]);
        }

        setHasMore(response.data.hasMore || false);
        setLastTimestamp(response.data.lastTimestamp || null);
      } catch (err) {
        console.error("Error fetching stories:", err);
        setError("Failed to load stories. Please try again later.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [lastTimestamp]
  );

  // Initial fetch
  useEffect(() => {
    fetchStories(true);
  }, [fetchStories]);

  // Setup infinite scroll
  const lastStoryRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          fetchStories(false);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore, fetchStories]
  );

  // Handle story creation
  const handleStoryCreated = async (newStory) => {
    // Add the user info to the new story
    const storyWithUser = {
      ...newStory,
      user: {
        userId: user.id,
        username: user.username,
        displayName: user.displayName || user.username,
        avatar: user.avatar,
      },
    };

    setStories((prev) => [storyWithUser, ...prev]);
    setShowCreateModal(false);
  };

  // Handle story deletion
  const handleDeleteStory = (storyId) => {
    setStories((prev) => prev.filter((story) => story.id !== storyId));
  };

  return (
    <div className="bg-gradient-to-b from-indigo-50 to-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Header section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Community Stories
          </h1>

          {user ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Share Your Story
            </button>
          ) : (
            <Link
              to="/login"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Log in to Share
            </Link>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        )}

        {/* Stories list */}
        {!loading && stories.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              No Stories Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Be the first to share your meditation experience with the
              community.
            </p>
            {user ? (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Share Your Story
              </button>
            ) : (
              <Link
                to="/login"
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Log in to Share
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {stories.map((story, index) => {
              // Apply ref to last story for infinite scroll
              const isLastStory = index === stories.length - 1;
              return (
                <StoryCard
                  key={story.id}
                  story={story}
                  currentUser={user}
                  onDelete={handleDeleteStory}
                  ref={isLastStory ? lastStoryRef : null}
                />
              );
            })}

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
            )}

            {/* End of results message */}
            {!hasMore && stories.length > 0 && !loadingMore && (
              <p className="text-center text-gray-500 py-4">
                You've reached the end of the stories.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Create story modal */}
      {showCreateModal && (
        <CreateStoryModal
          onClose={() => setShowCreateModal(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </div>
  );
};

export default Community;
