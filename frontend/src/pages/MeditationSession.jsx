// src/pages/MeditationSession.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const MeditationSession = () => {
  const { id } = useParams(); // meditation type id
  const { user } = useAuth();
  const navigate = useNavigate();

  const [meditationType, setMeditationType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Session state
  const [sessionState, setSessionState] = useState("setup"); // setup, running, paused, notes, completed
  const [selectedDuration, setSelectedDuration] = useState(5); // Default 5 minutes
  const [completedDuration, setCompletedDuration] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [notes, setNotes] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [sessionStats, setSessionStats] = useState(null);

  // Timer ref for cleanup
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const pausedTimeRef = useRef(null);
  const totalPausedTimeRef = useRef(0);

  // Fetch meditation type details
  useEffect(() => {
    const fetchMeditationType = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/meditation-types/${id}`);

        if (response.data.success) {
          setMeditationType(response.data.data);
          setError(null);
        } else {
          setError(response.data.message || "Failed to load meditation type");
        }
      } catch (err) {
        console.error("Error fetching meditation type:", err);
        setError(
          "Failed to load this meditation type. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMeditationType();
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (sessionState === "running") {
      timerRef.current = setInterval(() => {
        const now = new Date();
        const elapsedSeconds =
          Math.floor((now - startTimeRef.current) / 1000) -
          totalPausedTimeRef.current;
        const timeRemaining = Math.max(
          0,
          selectedDuration * 60 - elapsedSeconds
        );

        setRemainingTime(timeRemaining);

        if (timeRemaining === 0) {
          handleSessionComplete();
        }
      }, 1000);
    } else if (sessionState === "paused") {
      clearInterval(timerRef.current);
    }

    // Cleanup timer on component unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionState, selectedDuration]);

  const startSession = () => {
    startTimeRef.current = new Date();
    totalPausedTimeRef.current = 0;
    setRemainingTime(selectedDuration * 60);
    setSessionState("running");
  };

  const pauseSession = () => {
    pausedTimeRef.current = new Date();
    setSessionState("paused");
  };

  const resumeSession = () => {
    totalPausedTimeRef.current += Math.floor(
      (new Date() - pausedTimeRef.current) / 1000
    );
    pausedTimeRef.current = null;
    setSessionState("running");
  };

  const endSession = () => {
    const actualDuration = Math.floor(
      (selectedDuration * 60 - remainingTime) / 60
    );

    if (actualDuration < 5) {
      if (
        window.confirm(
          "We recommend meditating for at least 5 minutes to get benefits. Do you still want to end the session?"
        )
      ) {
        showNotesDialog(5); // Minimum 5 minutes
      }
    } else {
      showNotesDialog(actualDuration);
    }
  };

  const showNotesDialog = (duration) => {
    setSessionState("notes");
    setCompletedDuration(duration);
  };

  const handleSessionComplete = () => {
    clearInterval(timerRef.current);
    // Use showNotesDialog to show the notes screen
    showNotesDialog(selectedDuration);
  };

  const recordSession = async (duration) => {
    try {
      const token = localStorage.getItem("accessToken");

      // Make sure meditationType exists before accessing its name property
      const meditationTypeName = meditationType?.name || "General Meditation";

      const response = await axios.post(
        "/api/meditation/session",
        {
          duration,
          meditationType: meditationTypeName,
          notes: notes.trim() || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setSessionStats(response.data.data);
        setShowSuccess(true);

        // Log to check if streak data is coming back correctly
        console.log("Session recorded successfully:", response.data.data);

        // If streak is still 0 after a successful session, we might need to investigate
        if (response.data.data.streak === 0) {
          console.warn(
            "Streak is still 0 after session. This might be an issue with the backend."
          );
        }
      } else {
        setError("Failed to record meditation session");
      }
    } catch (err) {
      console.error("Error recording session:", err);
      if (err.response) {
        console.error("Error response data:", err.response.data);
      }
      setError("Failed to record meditation session. Please try again.");
    }
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-indigo-50">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="ml-4 text-gray-600">Loading meditation session...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-indigo-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-semibold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-block px-5 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!meditationType) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-indigo-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Meditation Type Not Found
          </h2>
          <p className="text-gray-700 mb-6">
            The meditation type you're looking for could not be found.
          </p>
          <button
            onClick={() => navigate("/explore")}
            className="inline-block px-5 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="h-2 bg-green-500"></div>
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>

              <h2 className="text-3xl font-serif text-gray-900 mb-2">
                Session Complete!
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Great job completing your {meditationType.name} meditation.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-1">
                    Session Duration
                  </h3>
                  <p className="text-2xl text-indigo-700">
                    {sessionStats.session.duration} min
                  </p>
                </div>
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-sm font-semibold text-indigo-900 mb-1">
                    Current Streak
                  </h3>
                  <p className="text-2xl text-indigo-700">
                    {sessionStats.streak} days
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg mb-8">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  Total Meditation Time
                </h3>
                <p className="text-3xl text-blue-700">
                  {sessionStats.totalMinutes} minutes
                </p>
              </div>

              {sessionStats.newAchievements &&
                sessionStats.newAchievements.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      New Achievements Unlocked!
                    </h3>
                    <div className="space-y-3">
                      {sessionStats.newAchievements.map(
                        (achievement, index) => (
                          <div
                            key={index}
                            className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center"
                          >
                            <span className="text-yellow-500 text-xl mr-3">
                              🏆
                            </span>
                            <div>
                              <p className="font-medium text-gray-800">
                                {achievement.title}
                              </p>
                              <p className="text-sm text-gray-600">
                                {achievement.description}
                              </p>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              <div className="flex flex-col space-y-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                >
                  View Dashboard
                </button>
                <button
                  onClick={() => navigate(`/meditation/${id}`)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Back to {meditationType.name}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Session Setup */}
        {sessionState === "setup" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="h-2 bg-indigo-600"></div>
            <div className="p-8">
              <h1 className="text-3xl font-serif text-gray-900 mb-4">
                {meditationType.name}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {meditationType.description}
              </p>

              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Choose Your Session Duration
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  {[5, 10, 15, 20, 30, 45].map((minutes) => (
                    <button
                      key={minutes}
                      onClick={() => setSelectedDuration(minutes)}
                      className={`p-4 rounded-lg text-center ${
                        selectedDuration === minutes
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } transition-colors`}
                    >
                      {minutes} min
                    </button>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom duration (minutes)
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={selectedDuration}
                      onChange={(e) =>
                        setSelectedDuration(parseInt(e.target.value) || 5)
                      }
                      className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="ml-2 text-gray-500">minutes</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startSession}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors text-center"
              >
                Begin Meditation
              </button>
            </div>
          </div>
        )}

        {/* Active Session */}
        {(sessionState === "running" || sessionState === "paused") && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="h-2 bg-indigo-600"></div>
            <div className="p-8 text-center">
              <h1 className="text-3xl font-serif text-gray-900 mb-4">
                {meditationType.name}
              </h1>

              <div className="mb-8">
                <div className="text-6xl font-mono font-light text-indigo-700 mb-4">
                  {formatTime(remainingTime)}
                </div>
                <p className="text-gray-500">
                  {sessionState === "running"
                    ? "Meditation in progress..."
                    : "Paused"}
                </p>
              </div>

              <div className="flex justify-center space-x-4 mb-8">
                {sessionState === "running" ? (
                  <button
                    onClick={pauseSession}
                    className="px-6 py-3 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-colors"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={resumeSession}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors"
                  >
                    Resume
                  </button>
                )}

                <button
                  onClick={endSession}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors"
                >
                  End Session
                </button>
              </div>

              <div className="p-4 bg-indigo-50 rounded-lg">
                <p className="text-gray-700">
                  Find a comfortable position. Let your breath flow naturally.
                  When your mind wanders, gently bring your attention back to
                  your breath.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes Dialog */}
        {sessionState === "notes" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="h-2 bg-green-500"></div>
            <div className="p-8">
              <h1 className="text-3xl font-serif text-gray-900 mb-4 text-center">
                Session Complete
              </h1>

              <div className="mb-6 text-center">
                <p className="text-xl text-gray-600">
                  Congratulations on completing your {completedDuration} minute{" "}
                  {meditationType.name} meditation.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Notes (Optional)
                </label>
                <textarea
                  rows="4"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How was your meditation experience? Record any thoughts or insights..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <button
                onClick={() => recordSession(completedDuration)}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-colors text-center"
              >
                Save Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeditationSession;
