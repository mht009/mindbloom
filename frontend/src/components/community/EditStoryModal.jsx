// src/components/community/EditStoryModal.jsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import MentionAutocomplete from "./MentionAutocomplete";

const EditStoryModal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch the story details when the component mounts
  useEffect(() => {
    const fetchStory = async () => {
      try {
        setLoading(true);

        const response = await axios.get(`/api/stories/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });

        const story = response.data.story;

        if (!story) {
          setError("Story not found.");
          return;
        }

        // Set the form fields with the story data
        setTitle(story.title || "");
        setBody(story.body || "");

        // Join hashtags into a comma-separated string
        if (story.hashtags && Array.isArray(story.hashtags)) {
          setHashtags(story.hashtags.join(", "));
        }
      } catch (err) {
        console.error("Error fetching story:", err);
        setError("Failed to load story details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      // Parse hashtags from the input
      const hashtagsArray = hashtags
        .split(/[,\s]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag && !tag.startsWith("#"))
        .map((tag) => (tag.startsWith("#") ? tag.substring(1) : tag));

      // Update the story
      await axios.put(
        `/api/stories/${id}`,
        {
          title,
          body,
          hashtags: hashtagsArray,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      // Navigate back to the story details page
      navigate(`/community/story/${id}`);
    } catch (err) {
      console.error("Error updating story:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update your story. Please try again."
      );
      setSubmitting(false);
    }
  };

  // Handle cancel button
  const handleCancel = () => {
    navigate(`/community/story/${id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !title && !body) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Error</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/community")}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Back to Community
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200 p-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Your Story
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-gray-700 font-medium mb-2"
              >
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Give your story a title"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="body"
                className="block text-gray-700 font-medium mb-2"
              >
                Your Story
              </label>
              <MentionAutocomplete
                value={body}
                onChange={setBody}
                placeholder="Share your meditation experience or insights..."
                rows={8}
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="hashtags"
                className="block text-gray-700 font-medium mb-2"
              >
                Hashtags
              </label>
              <input
                type="text"
                id="hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="meditation, mindfulness, beginner (separate with commas)"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {submitting ? "Updating..." : "Update Story"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditStoryModal;
