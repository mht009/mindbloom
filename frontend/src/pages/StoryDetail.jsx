// src/pages/StoryDetail.jsx
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/community/UserAvatar";
import CommentList from "../components/community/CommentList";

const StoryDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchStory();
  }, [id]);

  useEffect(() => {
    if (story) {
      fetchLikeInfo();
    }
  }, [id, story]);

  const fetchLikeInfo = async () => {
    try {
      // Fetch like count
      const countResponse = await axios.get(`/api/stories/${id}/likes`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setLikeCount(countResponse.data.likesCount);

      // Fetch like status
      const statusResponse = await axios.get(
        `/api/stories/${id}/likes/status`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      setIsLiked(statusResponse.data.isLiked);
    } catch (err) {
      console.error("Error fetching like information:", err);
    }
  };

  const fetchStory = async () => {
    try {
      setLoading(true);

      // Fetch the actual story data from the API
      const response = await axios.get(`/api/stories/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      // Set the story data
      setStory(response.data.story);
    } catch (err) {
      console.error("Error fetching story:", err);
      setError(
        "Failed to load this story. It may have been deleted or is unavailable."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    try {
      if (isLiked) {
        await axios.delete(`/api/stories/${id}/like`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setLikeCount((prev) => prev - 1);
      } else {
        await axios.post(
          `/api/stories/${id}/like`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        setLikeCount((prev) => prev + 1);
      }
      setIsLiked(!isLiked);
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    try {
      setIsDeleting(true);
      await axios.delete(`/api/stories/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      navigate("/community", { replace: true });
    } catch (err) {
      console.error("Error deleting story:", err);
      setIsDeleting(false);
    }
  };

  // Format the content for display
  const formatContent = (text) => {
    if (!text) return { __html: "" };

    // Process hashtags and make them clickable
    let formattedText = text;
    if (story.hashtags && story.hashtags.length > 0) {
      story.hashtags.forEach((tag) => {
        const regex = new RegExp(`#${tag}\\b`, "g");
        formattedText = formattedText.replace(
          regex,
          `<a href="/community/hashtag/${tag}" class="text-indigo-600 hover:underline">#${tag}</a>`
        );
      });
    }

    // Process @mentions (this would depend on your backend implementation)
    formattedText = formattedText.replace(
      /@(\w+)/g,
      '<a href="/profile/$1" class="text-indigo-600 hover:underline">@$1</a>'
    );

    // Convert line breaks to paragraphs
    formattedText = formattedText
      .split("\n")
      .map((paragraph) => (paragraph ? `<p>${paragraph}</p>` : "<br />"))
      .join("");

    return { __html: formattedText };
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

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Story Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              {error || "This story could not be found."}
            </p>
            <Link
              to="/community"
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Back to Community
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const timeAgo = formatDistanceToNow(new Date(story.createdAt), {
    addSuffix: true,
  });
  const isAuthor = user && user.id === story.userId;
  const isAdmin = user && user.isAdmin;

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Back to community */}
        <Link
          to="/community"
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
          Back to Community
        </Link>

        {/* Story card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          {/* Story header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <UserAvatar
                  userId={story.userId}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <Link
                    to={`/profile/${story.userId}`}
                    className="font-medium text-gray-800 hover:text-indigo-600"
                  >
                    {story.user
                      ? story.user.username
                      : story.username || "User " + story.userId}
                  </Link>
                  <p className="text-sm text-gray-500">{timeAgo}</p>
                </div>
              </div>

              {/* Author actions */}
              {(isAuthor || isAdmin) && (
                <div className="flex space-x-3">
                  {isAuthor && (
                    <Link
                      to={`/community/edit/${story.id}`}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                    >
                      Edit Story
                    </Link>
                  )}
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                    {!isAuthor && isAdmin ? " (Admin)" : ""}
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {story.title}
            </h1>
          </div>

          {/* Story content */}
          <div className="p-6">
            <div
              className="prose prose-indigo max-w-none"
              dangerouslySetInnerHTML={formatContent(story.body)}
            />

            {/* Hashtags */}
            {story.hashtags && story.hashtags.length > 0 && (
              <div className="mt-6">
                <div className="flex flex-wrap gap-2">
                  {story.hashtags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/community/hashtag/${tag}`}
                      className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-sm hover:bg-indigo-100"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Story actions */}
          <div className="px-6 py-4 border-t border-gray-100 flex items-center space-x-6">
            <button
              onClick={toggleLike}
              className={`flex items-center ${
                isLiked ? "text-pink-600" : "text-gray-500 hover:text-pink-600"
              }`}
            >
              <svg
                className={`w-6 h-6 mr-2 ${
                  isLiked
                    ? "fill-current text-pink-600"
                    : "fill-none stroke-current"
                }`}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              {likeCount} {likeCount === 1 ? "Like" : "Likes"}
            </button>

            <button
              className="flex items-center text-gray-500 hover:text-indigo-600"
              onClick={() =>
                document
                  .getElementById("comments-section")
                  .scrollIntoView({ behavior: "smooth" })
              }
            >
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Comments
            </button>

            <button className="flex items-center text-gray-500 hover:text-indigo-600">
              <svg
                className="w-6 h-6 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              Share
            </button>
          </div>
        </div>

        {/* Comments section */}
        <div
          id="comments-section"
          className="bg-white rounded-lg shadow-md p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Comments</h2>
          <CommentList storyId={id} currentUser={user} />
        </div>

        {/* Related stories section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Related Stories
          </h2>
          <p className="text-gray-500 text-center py-4">
            Related stories feature coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default StoryDetail;
