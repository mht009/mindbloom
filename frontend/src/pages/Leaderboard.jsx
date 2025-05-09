// src/pages/Leaderboard.jsx
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "../components/community/UserAvatar";

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [currentUserRank, setCurrentUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState("all");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("global");
  const [aroundMeData, setAroundMeData] = useState(null);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/leaderboard`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        params: {
          timeframe,
          page,
          limit: 20,
        },
      });

      if (response.data.success) {
        setLeaderboardData(response.data.data);
        setCurrentUserRank(response.data.data.currentUserRank);
      }
    } catch (err) {
      console.error("Error fetching leaderboard:", err);
      setError("Failed to load leaderboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [timeframe, page]);

  // Fetch around me data
  const fetchAroundMe = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/leaderboard/around-me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        params: {
          timeframe,
          range: 5,
        },
      });

      if (response.data.success) {
        setAroundMeData(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching around me data:", err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  // Handle timeframe change
  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    setPage(1);
  };

  // Effect to fetch data based on active tab
  useEffect(() => {
    if (activeTab === "global") {
      fetchLeaderboard();
    } else if (activeTab === "aroundMe" && user) {
      fetchAroundMe();
    }
  }, [activeTab, user, fetchLeaderboard, fetchAroundMe]);

  // Format minutes to hours and minutes
  const formatMinutes = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}m` : ""}`;
  };

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !leaderboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
          <div className="text-center">
            <button
              onClick={() => {
                if (activeTab === "global") fetchLeaderboard();
                else if (activeTab === "aroundMe") fetchAroundMe();
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-serif text-indigo-900 mb-4">
            Meditation Leaderboard
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See how you rank among fellow meditators and celebrate your
            mindfulness journey
          </p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg shadow-sm">
            {["all", "week", "month", "year"].map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeframeChange(tf)}
                className={`px-6 py-2 text-sm font-medium ${
                  timeframe === tf
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } ${tf === "all" ? "rounded-l-lg" : ""} ${
                  tf === "year" ? "rounded-r-lg" : ""
                } ${
                  tf !== "all" && tf !== "year"
                    ? "border-l border-gray-200"
                    : ""
                } transition-colors`}
              >
                {tf.charAt(0).toUpperCase() + tf.slice(1)}
                {tf === "all" ? " Time" : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex justify-center space-x-8">
            <button
              onClick={() => setActiveTab("global")}
              className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "global"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } transition-colors`}
            >
              Global Leaderboard
            </button>
            {user && (
              <button
                onClick={() => setActiveTab("aroundMe")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "aroundMe"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                } transition-colors`}
              >
                Around Me
              </button>
            )}
          </nav>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === "global" && leaderboardData && (
            <>
              {/* Current User Card */}
              {currentUserRank && user && (
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 mb-8 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="text-4xl font-bold mr-6">
                        #{currentUserRank.rank}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold">
                          {user.username}
                        </h3>
                        <p className="opacity-90">
                          {formatMinutes(currentUserRank.totalMinutes)}{" "}
                          meditated
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm opacity-75">Current Streak</p>
                      <p className="text-2xl font-bold">
                        {user.streakCount || 0} days
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Leaderboard Table */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Streak
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leaderboardData.leaderboard.map((entry) => (
                      <tr
                        key={entry.id}
                        className={`${
                          user && entry.id === user.id
                            ? "bg-indigo-50"
                            : "hover:bg-gray-50"
                        } transition-colors`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div
                              className={`text-lg font-bold ${
                                entry.rank === 1
                                  ? "text-yellow-500"
                                  : entry.rank === 2
                                  ? "text-gray-400"
                                  : entry.rank === 3
                                  ? "text-amber-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {entry.rank === 1
                                ? "🥇"
                                : entry.rank === 2
                                ? "🥈"
                                : entry.rank === 3
                                ? "🥉"
                                : `#${entry.rank}`}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <UserAvatar
                              userId={entry.id}
                              className="w-10 h-10 rounded-full mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900">
                                {entry.username || entry.name}
                              </div>
                              {user && entry.id === user.id && (
                                <div className="text-xs text-indigo-600">
                                  (You)
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">
                            {formatMinutes(entry.totalMinutes || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-gray-900">
                            <span className="mr-1">🔥</span>
                            {entry.streakCount || 0} days
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {leaderboardData.pagination &&
                  leaderboardData.pagination.totalPages > 1 && (
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between sm:px-6">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <button
                          onClick={() => setPage(page - 1)}
                          disabled={page === 1}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setPage(page + 1)}
                          disabled={
                            page === leaderboardData.pagination.totalPages
                          }
                          className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing page{" "}
                            <span className="font-medium">{page}</span> of{" "}
                            <span className="font-medium">
                              {leaderboardData.pagination.totalPages}
                            </span>
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                            <button
                              onClick={() => setPage(page - 1)}
                              disabled={page === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Previous
                            </button>
                            <button
                              onClick={() => setPage(page + 1)}
                              disabled={
                                page === leaderboardData.pagination.totalPages
                              }
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Next
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            </>
          )}

          {activeTab === "aroundMe" && aroundMeData && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Users Around Your Rank
                </h2>
                {!aroundMeData.leaderboard ||
                aroundMeData.leaderboard.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Start meditating to see your ranking!
                  </p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Streak
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {aroundMeData.leaderboard.map((entry) => (
                        <tr
                          key={entry.id}
                          className={`${
                            user && entry.id === user.id
                              ? "bg-indigo-50"
                              : "hover:bg-gray-50"
                          } transition-colors`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-lg font-bold text-gray-600">
                              #{entry.rank}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <UserAvatar
                                userId={entry.id}
                                className="w-10 h-10 rounded-full mr-3"
                              />
                              <div>
                                <div
                                  className={`font-medium ${
                                    user && entry.id === user.id
                                      ? "text-indigo-600"
                                      : "text-gray-900"
                                  }`}
                                >
                                  {entry.username || entry.name}
                                </div>
                                {user && entry.id === user.id && (
                                  <div className="text-xs text-indigo-600">
                                    (You)
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">
                              {formatMinutes(entry.totalMinutes || 0)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-gray-900">
                              <span className="mr-1">🔥</span>
                              {entry.streakCount || 0} days
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
