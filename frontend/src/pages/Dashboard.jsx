// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import MeditationCalendar from "../components/MeditationCalendar";

// Chart components
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [meditationHistory, setMeditationHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");

        // Fetch dashboard overview data
        const dashboardResponse = await axios.get("/api/meditation/dashboard", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Fetch meditation history
        const historyResponse = await axios.get("/api/meditation/history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Fetch achievements
        const achievementsResponse = await axios.get(
          "/api/meditation/achievements",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (dashboardResponse.data.success) {
          setDashboardData(dashboardResponse.data.data);
        } else {
          setError("Failed to load dashboard data");
        }

        if (historyResponse.data.success) {
          setMeditationHistory(historyResponse.data.data.sessions);
        } else {
          setError("Failed to load meditation history");
        }

        if (achievementsResponse.data.success) {
          setAchievements(achievementsResponse.data.data.achievements);
        } else {
          setError("Failed to load achievements");
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Group meditation sessions by day for chart
  const getChartData = () => {
    const sessionsByDay = {};

    meditationHistory.forEach((session) => {
      const date = formatDate(session.completedAt);
      if (!sessionsByDay[date]) {
        sessionsByDay[date] = {
          date,
          totalMinutes: 0,
          sessions: 0,
        };
      }

      sessionsByDay[date].totalMinutes += session.duration;
      sessionsByDay[date].sessions += 1;
    });

    return Object.values(sessionsByDay)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-14); // Last 14 days
  };

  // Group meditation sessions by type
  const getMeditationTypeStats = () => {
    const typeStats = {};

    meditationHistory.forEach((session) => {
      const type = session.meditationType || "Unspecified";
      if (!typeStats[type]) {
        typeStats[type] = {
          name: type,
          totalMinutes: 0,
          sessions: 0,
        };
      }

      typeStats[type].totalMinutes += session.duration;
      typeStats[type].sessions += 1;
    });

    return Object.values(typeStats).sort(
      (a, b) => b.totalMinutes - a.totalMinutes
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-indigo-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600">
          Loading your meditation dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-indigo-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link
            to="/"
            className="inline-block px-5 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-indigo-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            No Meditation Data
          </h2>
          <p className="text-gray-700 mb-6">
            You haven't started your meditation journey yet. Begin your first
            session to track your progress.
          </p>
          <Link
            to="/explore"
            className="inline-block px-5 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Explore Meditation Types
          </Link>
        </div>
      </div>
    );
  }

  const chartData = getChartData();
  const meditationTypeStats = getMeditationTypeStats();

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-serif text-gray-900 mb-6">
          Your Meditation Journey
        </h1>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "overview"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "history"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab("stats")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "stats"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Statistics
              </button>
              <button
                onClick={() => setActiveTab("achievements")}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === "achievements"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Achievements
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-indigo-50 p-6 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                      Current Streak
                    </h3>
                    <p className="text-4xl text-indigo-700 font-light">
                      {dashboardData.streakCount}
                    </p>
                    <p className="text-sm text-indigo-600 mt-1">days</p>
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                      Total Meditation Time
                    </h3>
                    <p className="text-4xl text-indigo-700 font-light">
                      {dashboardData.totalMinutes}
                    </p>
                    <p className="text-sm text-indigo-600 mt-1">minutes</p>
                  </div>

                  <div className="bg-indigo-50 p-6 rounded-lg text-center">
                    <h3 className="text-lg font-semibold text-indigo-900 mb-2">
                      Achievements Unlocked
                    </h3>
                    <p className="text-4xl text-indigo-700 font-light">
                      {dashboardData.totalAchievementsCount} /{" "}
                      {dashboardData.totalPossibleAchievements}
                    </p>
                    <p className="text-sm text-indigo-600 mt-1">completed</p>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Recent Activity
                </h2>

                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="totalMinutes"
                          name="Minutes Meditated"
                          stroke="#4f46e5"
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Recent Achievements
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dashboardData.highlightedAchievements.length > 0 ? (
                    dashboardData.highlightedAchievements.map(
                      (achievement, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg flex items-start ${
                            achievement.achieved
                              ? "bg-yellow-50 border border-yellow-200"
                              : "bg-gray-50 border border-gray-200"
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center mr-4 ${
                              achievement.achieved
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-gray-200 text-gray-500"
                            }`}
                          >
                            {achievement.achieved ? "🏆" : "🔒"}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              {achievement.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {achievement.description}
                            </p>
                            {!achievement.achieved && (
                              <div className="mt-2">
                                <div className="h-2 bg-gray-200 rounded-full">
                                  <div
                                    className="h-2 bg-indigo-500 rounded-full"
                                    style={{
                                      width: `${achievement.progress}%`,
                                    }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {achievement.progress}% complete
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <p className="text-gray-500">
                      Complete more meditation sessions to unlock achievements.
                    </p>
                  )}
                </div>

                <div className="mt-8 text-center">
                  <Link
                    to="/explore"
                    className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                  >
                    Start New Meditation
                  </Link>
                </div>
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Your Meditation History
                </h2>

                {meditationHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Type
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Duration
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {meditationHistory.map((session) => (
                          <tr key={session.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(session.completedAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {session.meditationType || "Unspecified"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {session.duration} min
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate">
                              {session.notes || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">
                      No meditation sessions recorded yet. Start your first
                      session to begin tracking your progress.
                    </p>
                    <Link
                      to="/explore"
                      className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                    >
                      Start Meditating
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === "stats" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                  Meditation Statistics
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Minutes by Meditation Type
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={meditationTypeStats}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="totalMinutes"
                            name="Total Minutes"
                            fill="#4f46e5"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Sessions by Meditation Type
                    </h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={meditationTypeStats}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="sessions"
                            name="Number of Sessions"
                            fill="#10b981"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Summary Statistics
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500">Total Sessions</p>
                      <p className="text-2xl font-light text-indigo-700">
                        {dashboardData.stats.totalSessions || 0}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500">
                        Avg. Session Length
                      </p>
                      <p className="text-2xl font-light text-indigo-700">
                        {dashboardData.stats.averageSessionLength
                          ? `${Math.round(
                              dashboardData.stats.averageSessionLength
                            )} min`
                          : "0 min"}
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500">Longest Streak</p>
                      <p className="text-2xl font-light text-indigo-700">
                        {dashboardData.stats.longestStreak || 0} days
                      </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                      <p className="text-sm text-gray-500">
                        Different Types Tried
                      </p>
                      <p className="text-2xl font-light text-indigo-700">
                        {meditationTypeStats.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Achievements Tab */}
            {activeTab === "achievements" && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Your Achievements
                </h2>
                <p className="text-gray-600 mb-6">
                  You've unlocked {dashboardData.totalAchievementsCount} out of{" "}
                  {dashboardData.totalPossibleAchievements} possible
                  achievements.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className={`p-5 rounded-lg ${
                        achievement.achieved
                          ? "bg-yellow-50 border border-yellow-200"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      <div className="flex items-start">
                        <div
                          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                            achievement.achieved
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-gray-200 text-gray-500"
                          }`}
                        >
                          {achievement.achieved ? "🏆" : "🔒"}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 text-lg">
                            {achievement.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {achievement.description}
                          </p>
                          {achievement.achieved && (
                            <p className="text-xs text-green-600 mt-2">
                              Unlocked{" "}
                              {achievement.achievedDate
                                ? formatDate(achievement.achievedDate)
                                : ""}
                            </p>
                          )}
                          {!achievement.achieved && (
                            <div className="mt-3">
                              <div className="h-2 bg-gray-200 rounded-full">
                                <div
                                  className="h-2 bg-indigo-500 rounded-full"
                                  style={{ width: `${achievement.progress}%` }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {achievement.progressText ||
                                  `${achievement.progress}% complete`}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Calendar Component */}
        <div className="pb-8">
          <MeditationCalendar />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
