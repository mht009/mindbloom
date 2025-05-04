// src/components/community/CommentList.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext"; // Adjust path as needed
import MentionAutocomplete from "./MentionAutocomplete";
import UserAvatar from "./UserAvatar";
import EditableComment from "./EditableComment";
import { resolveUsersForItems } from "../../utils/userResolver"; // Adjust path as needed

const CommentList = ({ storyId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchComments();
  }, [storyId]);

  const fetchComments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axios.get(`/api/stories/${storyId}/comments`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      let fetchedComments = response.data.comments || [];

      // Resolve usernames for all comments
      if (fetchedComments.length > 0) {
        fetchedComments = await resolveUsersForItems(fetchedComments);
      }

      setComments(fetchedComments);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments. Please try refreshing the page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await axios.post(
        `/api/stories/${storyId}/comments`,
        {
          body: newComment.trim(),
          content: newComment.trim(), // Send both formats for compatibility
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data && response.data.comment) {
        // Add user info to the new comment
        const newCommentWithUser = {
          ...response.data.comment,
          user: {
            userId: user.id,
            username: user.username,
            displayName: user.displayName || user.username,
            avatar: user.avatar,
          },
        };

        // Add the new comment to the list
        setComments([...comments, newCommentWithUser]);
        setNewComment(""); // Clear the input
      }
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError("Failed to post comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentUpdate = (updatedComment) => {
    // Update the comment in the list
    setComments(
      comments.map((comment) =>
        comment.id === updatedComment.id
          ? { ...updatedComment, user: comment.user } // Preserve user info
          : comment
      )
    );
  };

  const handleCommentDelete = (commentId) => {
    // Remove the deleted comment from the list
    setComments(comments.filter((comment) => comment.id !== commentId));
  };

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="mt-2 text-gray-500">Loading comments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-800">
        {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
      </h3>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {/* Comment Form */}
      {user && (
        <form onSubmit={handleCommentSubmit} className="mb-6">
          <div className="flex items-start space-x-3">
            <UserAvatar userId={user.id} className="w-8 h-8 rounded-full" />
            <div className="flex-grow">
              <MentionAutocomplete
                value={newComment}
                onChange={setNewComment}
                placeholder="Write a comment..."
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className={`px-4 py-2 rounded-md text-white ${
                    isSubmitting || !newComment.trim()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isSubmitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <p className="text-gray-500 italic">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <EditableComment
              key={comment.id}
              comment={comment}
              currentUser={user}
              onUpdate={handleCommentUpdate}
              onDelete={handleCommentDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentList;
