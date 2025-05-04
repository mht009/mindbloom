// src/context/AuthContext.jsx
import { createContext, useState, useEffect, useContext } from "react";
import {
  refreshTokenService,
  logoutService,
  setupAxiosInterceptors,
} from "./authUtils";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Refresh token function
  const refreshToken = async () => {
    try {
      const currentRefreshToken = localStorage.getItem("refreshToken");

      if (!currentRefreshToken) {
        throw new Error("No refresh token available");
      }

      const newAccessToken = await refreshTokenService(currentRefreshToken);

      if (newAccessToken) {
        localStorage.setItem("accessToken", newAccessToken);
        return true;
      }

      await logout();
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      await logout();
      return false;
    }
  };

  // Login function
  const login = (userData, tokens) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
  };

  // Logout function
  const logout = async () => {
    if (user) {
      await logoutService(user.id);
    }

    // Clear user data and tokens
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem("user");
    const accessToken = localStorage.getItem("accessToken");

    if (storedUser && accessToken) {
      setUser(JSON.parse(storedUser));
    }

    // Setup axios interceptors
    setupAxiosInterceptors(refreshToken);

    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, logout, loading, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
