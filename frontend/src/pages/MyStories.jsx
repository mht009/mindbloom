// src/pages/MyStories.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/community/UserAvatar";
import CreateStoryModal from "../components/community/CreateStoryModal";

const MyStories = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    fetchUserStories();
  }, [user, navigate]);

  const fetchUserStories = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get("/api/stories/mine", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      setStories(response.data.stories || []);
    } catch (err) {
      console.error("Error fetching your stories:", err);
      setError("Failed to load your stories. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    try {
      setIsDeleting(true);
      setSelectedStory(storyId);

      await axios.delete(`/api/stories/${storyId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      // Remove the deleted story from the list
      setStories(stories.filter((story) => story.id !== storyId));
    } catch (err) {
      console.error("Error deleting story:", err);
      alert("Failed to delete the story. Please try again.");
    } finally {
      setIsDeleting(false);
      setSelectedStory(null);
    }
  };

  const handleStoryCreated = (newStory) => {
    setStories([newStory, ...stories]);
    setShowCreateModal(false);
  };

  // Format story content preview
  const formatContentPreview = (text) => {
    if (!text) return "";

    // Strip HTML tags if any
    const strippedText = text.replace(/<[^>]*>/g, "");

    // Limit to a reasonable length for preview
    return strippedText.length > 150
      ? strippedText.substring(0, 150) + "..."
      : strippedText;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8">
      <div className="container mx-auto px-4">
        {/* Header section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Stories</h1>
            <p className="text-gray-600 mt-2">
              Manage all your meditation stories and experiences
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Create New Story
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* Stories list */}
        {stories.length === 0 ? (
          <div className="bg-white rounded-lg p-8 text-center shadow-md">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              You Haven't Shared Any Stories Yet
            </h2>
            <p className="text-gray-600 mb-6">
              Share your meditation experiences with the community.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Create Your First Story
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-1">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-duration-200"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center">
                      <UserAvatar
                        userId={user.id}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800">
                          {story.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(story.createdAt), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link
                        to={`/community/edit/${story.id}`}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteStory(story.id)}
                        disabled={isDeleting && selectedStory === story.id}
                        className="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
                      >
                        {isDeleting && selectedStory === story.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4">
                    {formatContentPreview(story.body)}
                  </p>

                  {/* Hashtags */}
                  {story.hashtags && story.hashtags.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {story.hashtags.map((tag) => (
                          <Link
                            key={tag}
                            to={`/community/hashtag/${tag}`}
                            className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs hover:bg-indigo-100"
                          >
                            #{tag}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View button */}
                  <div className="mt-4 text-right">
                    <Link
                      to={`/community/story/${story.id}`}
                      className="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      View Full Story
                    </Link>
                  </div>
                </div>
              </div>
            ))}
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

export default MyStories;
