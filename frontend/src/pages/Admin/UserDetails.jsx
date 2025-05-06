// src/pages/Admin/UserDetails.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";

const UserDetails = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stories, setStories] = useState([]);
  const [comments, setComments] = useState([]);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState("stories");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("");
  const [newRole, setNewRole] = useState("");
  const [actionInProgress, setActionInProgress] = useState(false);
  
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin, if not redirect
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/");
    }
  }, [currentUser, navigate]);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`/api/admin/usermgmt/users/${id}`);
        setUser(response.data);
      } catch (err) {
        console.error("Error fetching user details:", err);
        setError(
          err.response?.data?.message || 
          "Failed to load user details. Please try again."
        );
        toast.error("Failed to load user details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUserDetails();
    }
  }, [id]);

  // Fetch user content
  const fetchUserContent = async (type) => {
    if (!user) return;
    
    setLoadingContent(true);
    try {
      if (type === "stories") {
        const response = await axios.get(`/api/admin/usermgmt/users/${id}/stories?limit=10`);
        setStories(response.data.stories || []);
      } else if (type === "comments") {
        const response = await axios.get(`/api/admin/usermgmt/users/${id}/comments?limit=10`);
        setComments(response.data.comments || []);
      }
    } catch (err) {
      console.error(`Error fetching user ${type}:`, err);
      toast.error(`Failed to load user ${type}`);
    } finally {
      setLoadingContent(false);
    }
  };

  // Load content when tab changes
  useEffect(() => {
    if (user) {
      fetchUserContent(activeTab);
    }
  }, [activeTab, user]);

  const openModal = (type, role = "") => {
    setModalType(type);
    if (type === "role") {
      setNewRole(role || user.role);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setNewRole("");
    setError("");
  };

  const handleRoleChange = async () => {
    if (!newRole || newRole === user.role) {
      return closeModal();
    }

    setActionInProgress(true);
    setError("");

    try {
      await axios.put(`/api/admin/usermgmt/users/${id}/role`, {
        role: newRole,
      });
      
      // Update local state
      setUser({
        ...user,
        role: newRole
      });
      
      toast.success(`User role updated to ${newRole}`);
      closeModal();
    } catch (err) {
      console.error("Error updating user role:", err);
      setError(
        err.response?.data?.message || "Failed to update role. Please try again."
      );
      toast.error("Failed to update user role");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteUser = async () => {
    setActionInProgress(true);
    setError("");

    try {
      await axios.delete(`/api/admin/usermgmt/users/${id}`);
      toast.success("User deleted successfully");
      navigate("/admin/users");
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(
        err.response?.data?.message || "Failed to delete user. Please try again."
      );
      toast.error("Failed to delete user");
    } finally {
      setActionInProgress(false);
      closeModal();
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this story?")) {
      return;
    }

    try {
      await axios.delete(`/api/admin/stories/delete/${storyId}`);
      // Remove from local state
      setStories(stories.filter(story => story.id !== storyId));
      // Update counts
      setUser({
        ...user,
        storiesCount: user.storiesCount - 1
      });
      toast.success("Story deleted successfully");
    } catch (err) {
      console.error("Error deleting story:", err);
      toast.error("Failed to delete story");
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await axios.delete(`/api/admin/comments/delete/${commentId}`);
      // Remove from local state
      setComments(comments.filter(comment => comment.id !== commentId));
      // Update counts
      setUser({
        ...user,
        commentsCount: user.commentsCount - 1
      });
      toast.success("Comment deleted successfully");
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Failed to delete comment");
    }
  };

  // Render confirmation modal
  const renderModal = () => {
    if (!modalOpen) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div className="mt-3 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {modalType === "role"
                ? "Change User Role"
                : "Confirm User Deletion"}
            </h3>
            <div className="mt-2 px-7 py-3">
              {modalType === "role" ? (
                <div>
                  <p className="text-sm text-gray-500 mb-4">
                    Change role for user: <span className="font-bold">{user.username}</span>
                  </p>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete the user{" "}
                  <span className="font-bold">{user.username}</span>?
                  This action cannot be undone and will delete all user content.
                </p>
              )}

              {error && (
                <div className="mt-2 text-sm text-red-600">{error}</div>
              )}
            </div>
            <div className="items-center px-4 py-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 mr-2"
                disabled={actionInProgress}
              >
                Cancel
              </button>
              <button
                onClick={
                  modalType === "role" ? handleRoleChange : handleDeleteUser
                }
                className={`px-4 py-2 ${
                  modalType === "delete"
                    ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
                    : "bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500"
                } text-white text-base font-medium rounded-md shadow-sm focus:outline-none focus:ring-2`}
                disabled={actionInProgress}
              >
                {actionInProgress
                  ? "Processing..."
                  : modalType === "role"
                  ? "Change Role"
                  : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-10">
          <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2 text-gray-600">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-10">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <Link
            to="/admin/users"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to User Management
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => openModal("role", user.role)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={user.id === currentUser.id}
          >
            Change Role
          </button>
          <button
            onClick={() => openModal("delete")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            disabled={user.id === currentUser.id}
          >
            Delete User
          </button>
          <Link
            to="/admin/users"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Back to User List
          </Link>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 bg-gray-50">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            User Profile
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Detailed information about {user.username}
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-white">
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.id}
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
              <dt className="text-sm font-medium text-gray-500">Username</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.username}
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-white">
              <dt className="text-sm font-medium text-gray-500">Full name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.name}
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
              <dt className="text-sm font-medium text-gray-500">Email address</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.email || "—"}
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-white">
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {user.phone || "—"}
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.role === "admin" 
                    ? "bg-purple-100 text-purple-800" 
                    : "bg-green-100 text-green-800"
                }`}>
                  {user.role}
                </span>
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-white">
              <dt className="text-sm font-medium text-gray-500">Joined</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {new Date(user.createdAt).toLocaleString()}
              </dd>
            </div>
            <div className="px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
              <dt className="text-sm font-medium text-gray-500">Activity Stats</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="flex space-x-4">
                  <div>
                    <span className="font-medium">{user.storiesCount || 0}</span> Stories
                  </div>
                  <div>
                    <span className="font-medium">{user.commentsCount || 0}</span> Comments
                  </div>
                  {user.streakCount !== undefined && (
                    <div>
                      <span className="font-medium">{user.streakCount}</span> Day Streak
                    </div>
                  )}
                  {user.totalMinutes !== undefined && (
                    <div>
                      <span className="font-medium">{user.totalMinutes}</span> Total Minutes
                    </div>
                  )}
                </div>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* User Content Tabs */}
      <div className="bg-white shadow rounded-lg">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("stories")}
              className={`${
                activeTab === "stories"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Stories ({user.storiesCount || 0})
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`${
                activeTab === "comments"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm`}
            >
              Comments ({user.commentsCount || 0})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {loadingContent ? (
            <div className="text-center py-10">
              <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-2 text-gray-600">Loading content...</p>
            </div>
          ) : (
            <>
              {activeTab === "stories" && (
                <div>
                  {stories.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      No stories found for this user.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {stories.map((story) => (
                        <div key={story.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{story.title}</h3>
                              <p className="text-sm text-gray-500">
                                {new Date(story.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteStory(story.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          <p className="mt-2 text-gray-700 line-clamp-2">
                            {story.content}
                          </p>
                          <div className="mt-2 text-sm text-gray-500">
                            {story.likeCount || 0} likes · {story.commentCount || 0} comments
                          </div>
                          <a 
                            href={`/community/story/${story.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-indigo-600 hover:text-indigo-900 text-sm"
                          >
                            View Story →
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "comments" && (
                <div>
                  {comments.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      No comments found for this user.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm text-gray-500">
                                On story: <a 
                                  href={`/community/story/${comment.storyId}`} 
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  {comment.storyTitle || comment.storyId}
                                </a>
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(comment.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          <p className="mt-2 text-gray-700">
                            {comment.content}
                          </p>
                          <div className="mt-2 text-sm text-gray-500">
                            {comment.likeCount || 0} likes
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
};

export default UserDetails;