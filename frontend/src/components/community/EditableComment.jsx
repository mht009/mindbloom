// src/components/community/EditableComment.jsx
import { useState } from "react";
import axios from "axios";
import { formatDistanceToNow } from "date-fns";
import UserAvatar from "./UserAvatar";
import MentionAutocomplete from "./MentionAutocomplete";

const EditableComment = ({ comment, currentUser, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(
    comment.content || comment.body || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if the user is authorized to edit or delete
  const canEdit = currentUser && currentUser.id === comment.userId;
  const canDelete =
    currentUser && (currentUser.id === comment.userId || currentUser.isAdmin);
  const isAdmin = currentUser && currentUser.isAdmin;

  const startEditing = () => {
    setEditedContent(comment.content || comment.body || "");
    setIsEditing(true);
    setError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  const saveComment = async () => {
    if (!editedContent.trim()) {
      setError("Comment cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const response = await axios.put(
        `/api/stories/comments/${comment.id}`,
        {
          body: editedContent.trim(),
          content: editedContent.trim(), // Send both formats for compatibility
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      if (response.data && response.data.comment) {
        // Call the parent update handler
        onUpdate(response.data.comment);
        setIsEditing(false);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("Error updating comment:", err);
      setError(
        err.response?.data?.message ||
          "Failed to update comment. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async () => {
    const confirmMessage =
      isAdmin && currentUser.id !== comment.userId
        ? "Are you sure you want to delete this comment as an administrator?"
        : "Are you sure you want to delete this comment?";

    if (!window.confirm(confirmMessage)) return;

    try {
      setIsDeleting(true);

      // Use the admin endpoint if deleting as admin
      const deleteUrl =
        isAdmin && currentUser.id !== comment.userId
          ? `/api/admin/comments/delete/${comment.id}`
          : `/api/stories/comments/${comment.id}`;

      await axios.delete(deleteUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      // Call the parent delete handler
      onDelete(comment.id);
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Failed to delete comment. Please try again.");
      setIsDeleting(false);
    }
  };

  // Get the username to display
  const username = comment.user
    ? comment.user.username
    : comment.username || `User ${comment.userId}`;

  // Format the timestamp
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-100">
      {isEditing ? (
        // Editing mode
        <div>
          <div className="flex items-center mb-3">
            <UserAvatar
              userId={comment.userId}
              className="w-8 h-8 rounded-full mr-3"
            />
            <div>
              <p className="font-medium text-gray-800">{username}</p>
              <p className="text-xs text-gray-500">{timeAgo}</p>
            </div>
          </div>

          {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

          <MentionAutocomplete
            value={editedContent}
            onChange={setEditedContent}
            placeholder="Edit your comment..."
            rows={3}
            className="mb-3"
          />

          <div className="flex justify-end space-x-2">
            <button
              onClick={cancelEditing}
              className="px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveComment}
              disabled={isSubmitting || !editedContent.trim()}
              className={`px-3 py-1 rounded-md text-white ${
                isSubmitting || !editedContent.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        // Display mode
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <UserAvatar
                userId={comment.userId}
                className="w-8 h-8 rounded-full"
              />
              <div>
                <div className="flex items-center">
                  <p className="font-medium text-gray-800">{username}</p>
                  <span className="mx-2 text-gray-400">•</span>
                  <p className="text-xs text-gray-500">{timeAgo}</p>
                </div>
                <p className="mt-1 text-gray-700">
                  {comment.content || comment.body}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-2">
              {/* Edit button - only shown to comment author */}
              {canEdit && (
                <button
                  onClick={startEditing}
                  className="text-gray-400 hover:text-indigo-600"
                  title="Edit"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}

              {/* Delete button - shown to comment author or admin */}
              {canDelete && (
                <button
                  onClick={deleteComment}
                  disabled={isDeleting}
                  className={`text-gray-400 hover:text-red-500 ${
                    isDeleting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  title={
                    isAdmin && currentUser.id !== comment.userId
                      ? "Delete as Admin"
                      : "Delete"
                  }
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-t-2 border-red-500 border-solid rounded-full animate-spin"></div>
                  ) : (
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              )}

              {/* Admin badge */}
              {isAdmin && currentUser.id !== comment.userId && (
                <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditableComment;
