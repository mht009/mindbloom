// src/components/community/UserAvatar.jsx
import { useState, useEffect } from "react";
import axios from "axios";

const UserAvatar = ({ userId, className = "w-10 h-10", ...props }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If we implement a user fetch API, we would use it here
    // For now, let's just set a placeholder
    setUser({ username: "User" });
    setLoading(false);
  }, [userId]);

  if (loading) {
    return (
      <div
        className={`${className} bg-gray-200 rounded-full animate-pulse`}
      ></div>
    );
  }

  if (error || !user) {
    // Return a default avatar
    return (
      <div
        className={`${className} bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 font-bold`}
      >
        ?
      </div>
    );
  }

  // If user has an avatar, display it
  if (user.avatar) {
    return (
      <img
        src={user.avatar}
        alt={user.username}
        className={`${className} rounded-full object-cover`}
        {...props}
      />
    );
  }

  // Otherwise, display initials
  const initials = user.username ? user.username.charAt(0).toUpperCase() : "?";

  return (
    <div
      className={`${className} bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500 font-bold`}
      {...props}
    >
      {initials}
    </div>
  );
};

export default UserAvatar;
