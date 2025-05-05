// src/context/authUtils.js
import axios from "axios";

// Authentication utility functions
export const refreshTokenService = async (refreshToken) => {
  try {
    const response = await axios.post("/auth/refresh-token", {
      refreshToken,
    });
    return response.data.accessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
};

export const logoutService = async (userId) => {
  try {
    await axios.post("/api/auth/logout", { userId });
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

// Helper function to check if a token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true;
  }
};

// Set up axios interceptor for token refresh
export const setupAxiosInterceptors = (refreshTokenFn) => {
  // Add authorization header to every request if token exists
  const requestInterceptor = axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Handle response errors and token refresh
  const responseInterceptor = axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 OR 403 and not already retrying
      if (
        (error.response?.status === 401 || error.response?.status === 403) &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;

        // Try to refresh the token
        const refreshSuccess = await refreshTokenFn();

        if (refreshSuccess) {
          // Update the token in the header
          originalRequest.headers[
            "Authorization"
          ] = `Bearer ${localStorage.getItem("accessToken")}`;
          // Retry the original request
          return axios(originalRequest);
        }
      }

      return Promise.reject(error);
    }
  );

  // Return a cleanup function to remove interceptors
  return () => {
    axios.interceptors.request.eject(requestInterceptor);
    axios.interceptors.response.eject(responseInterceptor);
  };
};
