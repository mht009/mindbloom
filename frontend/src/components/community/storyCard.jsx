// src/components/community/StoryCard.jsx
import { useState, useEffect, forwardRef, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import CommentList from "./CommentList";
import UserAvatar from "./UserAvatar";

const StoryCard = forwardRef(({ story, onDelete, currentUser }, ref) => {
  const [expanded, setExpanded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch like information when the component mounts
  useEffect(() => {
    const fetchLikeInfo = async () => {
      try {
        // Fetch like count
        const countResponse = await axios.get(
          `/api/stories/${story.id}/likes`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        );
        setLikeCount(countResponse.data.likesCount);

        // Fetch like status if user is logged in
        if (currentUser) {
          const statusResponse = await axios.get(
            `/api/stories/${story.id}/likes/status`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            }
          );
          setIsLiked(statusResponse.data.isLiked);
        }
      } catch (err) {
        console.error("Error fetching like information:", err);
      }
    };

    fetchLikeInfo();
  }, [story.id, currentUser]);

  // Handle click outside of dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleLike = async () => {
    if (!currentUser) {
      // Prompt user to login if not authenticated
      alert("Please log in to like stories");
      return;
    }

    try {
      if (isLiked) {
        await axios.delete(`/api/stories/${story.id}/like`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setLikeCount((prev) => prev - 1);
      } else {
        await axios.post(
          `/api/stories/${story.id}/like`,
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
      await axios.delete(`/api/stories/${story.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      onDelete(story.id);
    } catch (err) {
      console.error("Error deleting story:", err);
      setIsDeleting(false);
    }
  };

  // Format the content for display
  const formatContent = (text) => {
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

    // Process @mentions
    formattedText = formattedText.replace(
      /@(\w+)/g,
      '<a href="/profile/$1" class="text-indigo-600 hover:underline">@$1</a>'
    );

    return { __html: formattedText };
  };

  const timeAgo = formatDistanceToNow(new Date(story.createdAt), {
    addSuffix: true,
  });
  const isAuthor = currentUser && currentUser.id === story.userId;
  const isAdmin = currentUser && currentUser.isAdmin;

  return (
    <div
      ref={ref}
      className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 mb-4"
    >
      {/* Header with user info */}
      <div className="px-6 pt-4 flex items-center justify-between">
        <div className="flex items-center">
          <UserAvatar
            userId={story.userId}
            className="w-10 h-10 rounded-full mr-3"
          />
          <div>
            <Link
              to={`/profile/${story.userId}`}
              className="font-medium text-gray-800 hover:text-indigo-600"
            >
              {story.user
                ? story.user.username
                : story.username || `User ${story.userId}`}
            </Link>
            <p className="text-xs text-gray-500">{timeAgo}</p>
          </div>
        </div>

        {/* Actions dropdown for author or admin */}
        {(isAuthor || isAdmin) && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Story options"
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
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 py-1 border border-gray-200">
                {isAuthor && (
                  <Link
                    to={`/community/edit/${story.id}`}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Edit Story
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleDelete();
                    setDropdownOpen(false);
                  }}
                  disabled={isDeleting}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? "Deleting..." : "Delete Story"}
                  {!isAuthor && isAdmin && " (Admin)"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Story title and content */}
      <div className="px-6 py-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          {story.title}
        </h2>

        <div
          className={`prose text-gray-600 ${expanded ? "" : "line-clamp-3"}`}
        >
          <div dangerouslySetInnerHTML={formatContent(story.body)} />
        </div>

        {story.body.length > 150 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      {/* Hashtags */}
      {story.hashtags && story.hashtags.length > 0 && (
        <div className="px-6 py-2">
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

      {/* Story actions */}
      <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleLike}
            className={`flex items-center text-sm ${
              isLiked ? "text-pink-600" : "text-gray-500 hover:text-pink-600"
            } transition-colors`}
          >
            <svg
              className={`w-5 h-5 mr-1 ${
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
            onClick={() => setShowComments(!showComments)}
            className="flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-1"
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

          <button className="flex items-center text-sm text-gray-500 hover:text-indigo-600 transition-colors">
            <svg
              className="w-5 h-5 mr-1"
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

        <Link
          to={`/community/story/${story.id}`}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          View Details
        </Link>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="px-6 py-4 bg-gray-50">
          <CommentList storyId={story.id} currentUser={currentUser} />
        </div>
      )}
    </div>
  );
});

export default StoryCard;
