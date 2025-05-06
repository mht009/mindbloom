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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-xl transform transition-all animate-fadeIn">
        <div className="flex justify-between items-center border-b dark:border-gray-700 p-5">
          <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
            Share Your Story
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
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

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-6 flex items-start">
              <svg 
                className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" 
                fill="currentColor" 
                viewBox="0 0 20 20" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  fillRule="evenodd" 
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                  clipRule="evenodd" 
                />
              </svg>
              <div>{error}</div>
            </div>
          )}

          <div className="mb-5">
            <label
              htmlFor="title"
              className="block text-gray-800 dark:text-gray-200 font-semibold mb-2"
            >
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 dark:bg-gray-700 dark:text-white transition-colors"
              placeholder="Give your story a title"
              required
            />
          </div>

          <div className="mb-5">
            <label
              htmlFor="body"
              className="block text-gray-800 dark:text-gray-200 font-semibold mb-2"
            >
              Your Story
            </label>
            <div className="rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400 transition-all">
              <MentionAutocomplete
                value={body}
                onChange={setBody}
                placeholder="Share your meditation experience or insights..."
                rows={7}
                className="w-full p-3 dark:bg-gray-700 dark:text-white focus:outline-none resize-none"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Use @ to mention other users
            </p>
          </div>

          <div className="mb-6">
            <label
              htmlFor="hashtags"
              className="block text-gray-800 dark:text-gray-200 font-semibold mb-2"
            >
              Hashtags
            </label>
            <div className="relative rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 dark:focus-within:ring-indigo-400 overflow-hidden">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">#</span>
              </div>
              <input
                type="text"
                id="hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="w-full p-3 pl-7 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none dark:bg-gray-700 dark:text-white transition-colors"
                placeholder="meditation, mindfulness, beginner (separate with commas)"
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Add relevant hashtags to help others find your story
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 font-medium shadow-sm flex items-center"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Posting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  Share Story
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStoryModal;