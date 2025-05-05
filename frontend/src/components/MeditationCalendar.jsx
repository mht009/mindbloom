// src/components/MeditationCalendar.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const MeditationCalendar = () => {
  const { user } = useAuth();
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    fetchCalendarData();
  }, [currentYear, currentMonth]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");

      const response = await axios.get(
        `/api/meditation/calendar?year=${currentYear}&month=${currentMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setCalendarData(response.data.data);
        setError(null);
      } else {
        setError(response.data.message || "Failed to load calendar data");
      }
    } catch (err) {
      console.error("Error fetching calendar data:", err);
      setError("Failed to load calendar data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleString(
      "default",
      { month: "long" }
    );

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-12 bg-gray-50"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      const sessionData = calendarData.find(
        (data) => new Date(data.date).toISOString().split("T")[0] === dateStr
      );

      // Color intensity based on meditation duration
      let bgColorClass = "bg-gray-50";
      let textColorClass = "text-gray-400";

      if (sessionData) {
        // Determine intensity of color based on duration
        if (sessionData.duration >= 60) {
          bgColorClass = "bg-indigo-600";
          textColorClass = "text-white";
        } else if (sessionData.duration >= 30) {
          bgColorClass = "bg-indigo-500";
          textColorClass = "text-white";
        } else if (sessionData.duration >= 15) {
          bgColorClass = "bg-indigo-400";
          textColorClass = "text-white";
        } else if (sessionData.duration >= 5) {
          bgColorClass = "bg-indigo-300";
          textColorClass = "text-indigo-900";
        } else {
          bgColorClass = "bg-indigo-200";
          textColorClass = "text-indigo-900";
        }
      }

      // Check if day is today
      const today = new Date();
      const isToday =
        today.getFullYear() === currentYear &&
        today.getMonth() + 1 === currentMonth &&
        today.getDate() === day;

      const borderClass = isToday ? "border-2 border-indigo-600" : "";

      days.push(
        <div
          key={day}
          className={`${bgColorClass} ${borderClass} h-12 flex flex-col items-center justify-center rounded-md`}
        >
          <span className={`text-sm font-medium ${textColorClass}`}>{day}</span>
          {sessionData && (
            <span className={`text-xs ${textColorClass}`}>
              {sessionData.duration} min
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2">
            <button
              onClick={() => {
                if (currentMonth === 1) {
                  setCurrentMonth(12);
                  setCurrentYear(currentYear - 1);
                } else {
                  setCurrentMonth(currentMonth - 1);
                }
              }}
              className="p-2 text-gray-500 hover:text-indigo-600"
            >
              &lt;
            </button>
            <h2 className="text-xl font-medium text-gray-900">
              {monthName} {currentYear}
            </h2>
            <button
              onClick={() => {
                if (currentMonth === 12) {
                  setCurrentMonth(1);
                  setCurrentYear(currentYear + 1);
                } else {
                  setCurrentMonth(currentMonth + 1);
                }
              }}
              className="p-2 text-gray-500 hover:text-indigo-600"
            >
              &gt;
            </button>
          </div>
          <button
            onClick={() => {
              const today = new Date();
              setCurrentMonth(today.getMonth() + 1);
              setCurrentYear(today.getFullYear());
            }}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Today
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-sm font-medium text-gray-500 text-center"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">{days}</div>

        <div className="mt-4">
          <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-200 mr-1"></div>
              <span>1-5 min</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-300 mr-1"></div>
              <span>5-15 min</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-400 mr-1"></div>
              <span>15-30 min</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-500 mr-1"></div>
              <span>30-60 min</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-indigo-600 mr-1"></div>
              <span>60+ min</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    );
  }

  return renderCalendar();
};

export default MeditationCalendar;
