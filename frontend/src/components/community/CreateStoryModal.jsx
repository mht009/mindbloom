// src/components/community/CreateStoryModal.jsx
import { useState } from "react";
import axios from "axios";
import MentionAutocomplete from "./MentionAutocomplete";

const CreateStoryModal = ({ onClose, onStoryCreated }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

      const response = await axios.post(
        "/api/stories",
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

      // Call the callback with the new story
      onStoryCreated(response.data.story);
    } catch (err) {
      console.error("Error creating story:", err);
      setError(
        err.response?.data?.message ||
          "Failed to post your story. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Share Your Story
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
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
            {/* Replace the textarea with our MentionAutocomplete component */}
            <MentionAutocomplete
              value={body}
              onChange={setBody}
              placeholder="Share your meditation experience or insights..."
              rows={5}
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
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Share Story"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoryModal;
