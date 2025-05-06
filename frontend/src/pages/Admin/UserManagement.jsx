// src/pages/Admin/UserManagement.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    limit: 10,
    offset: 0,
    total: 0,
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // "role" or "delete"
  const [newRole, setNewRole] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin, if not redirect
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      navigate("/");
    }
  }, [currentUser, navigate]);

  // Fetch users on component mount and when pagination changes
  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [pagination.offset, pagination.limit]);

  // Filter users when search term changes
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `/api/admin/usermgmt/users?limit=${pagination.limit}&offset=${pagination.offset}`
      );
      setUsers(response.data.users);
      setFilteredUsers(response.data.users);
      setPagination({
        ...pagination,
        total: response.data.metadata.total,
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get("/api/admin/usermgmt/users/stats");
      setStats(response.data.stats);
    } catch (err) {
      console.error("Error fetching stats:", err);
      // We don't set error here to avoid blocking the main functionality
    }
  };

  const handlePageChange = (newOffset) => {
    setPagination({
      ...pagination,
      offset: newOffset,
    });
  };

  const openModal = (type, user) => {
    setSelectedUser(user);
    setModalType(type);
    if (type === "role") {
      setNewRole(user.role);
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedUser(null);
    setNewRole("");
    setError("");
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole || newRole === selectedUser.role) {
      return;
    }

    setActionInProgress(true);
    setError("");

    try {
      await axios.put(`/api/admin/usermgmt/users/${selectedUser.id}/role`, {
        role: newRole,
      });
      
      // Update local state
      setUsers(
        users.map((u) =>
          u.id === selectedUser.id ? { ...u, role: newRole } : u
        )
      );
      
      setSuccessMessage(`User role updated to ${newRole} successfully`);
      setTimeout(() => setSuccessMessage(""), 3000);
      closeModal();
    } catch (err) {
      console.error("Error updating user role:", err);
      setError(
        err.response?.data?.message || "Failed to update role. Please try again."
      );
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) {
      return;
    }

    setActionInProgress(true);
    setError("");

    try {
      await axios.delete(`/api/admin/usermgmt/users/${selectedUser.id}`);
      
      // Update local state
      setUsers(users.filter((u) => u.id !== selectedUser.id));
      setPagination({
        ...pagination,
        total: pagination.total - 1,
      });
      
      setSuccessMessage("User deleted successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchStats(); // Refresh stats after deletion
      closeModal();
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(
        err.response?.data?.message || "Failed to delete user. Please try again."
      );
    } finally {
      setActionInProgress(false);
    }
  };

  const handleViewUserDetails = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  // Render stats cards
  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Total Users</h3>
          <p className="text-2xl font-bold text-indigo-600">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">New Users (7d)</h3>
          <p className="text-2xl font-bold text-green-600">{stats.newUsersLast7Days}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Total Content</h3>
          <p className="text-2xl font-bold text-indigo-600">{stats.totalStories} stories, {stats.totalComments} comments</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700">Admin Users</h3>
          <p className="text-2xl font-bold text-indigo-600">{stats.adminUsers}</p>
        </div>
      </div>
    );
  };

  // Render confirmation modal
  const renderModal = () => {
    if (!modalOpen || !selectedUser) return null;

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
                    Change role for user: <span className="font-bold">{selectedUser.username}</span>
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
                  <span className="font-bold">{selectedUser.username}</span>?
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Management</h1>
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Stats Section */}
      {renderStats()}
      
      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3">
            <label className="block text-sm font-medium text-gray-700">Search Users</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by username, name or email"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>
        </div>
      </div>
      
      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {loading ? (
          <div className="text-center py-10">
            <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-gray-600">Loading users...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === "admin" 
                            ? "bg-purple-100 text-purple-800" 
                            : "bg-green-100 text-green-800"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewUserDetails(user.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => openModal("role", user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          disabled={user.id === currentUser.id}
                        >
                          Change Role
                        </button>
                        <button
                          onClick={() => openModal("delete", user)}
                          className="text-red-600 hover:text-red-900"
                          disabled={user.id === currentUser.id}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {/* Pagination */}
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{Math.min(pagination.offset + 1, pagination.total)}</span> to{" "}
                    <span className="font-medium">
                      {Math.min(pagination.offset + pagination.limit, pagination.total)}
                    </span>{" "}
                    of <span className="font-medium">{pagination.total}</span> users
                  </p>
                </div>
                <div>
                  <button
                    onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                    disabled={pagination.offset === 0}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                    disabled={pagination.offset + pagination.limit >= pagination.total}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Modal */}
      {renderModal()}
    </div>
  );
};

export default UserManagement;