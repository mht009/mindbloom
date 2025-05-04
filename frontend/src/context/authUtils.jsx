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
    await axios.post("/auth/logout", { userId });
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
};

// Set up axios interceptor for token refresh
export const setupAxiosInterceptors = (refreshTokenFn) => {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      // If error is 401 (Unauthorized) and not already retrying
      if (error.response?.status === 401 && !originalRequest._retry) {
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

  // Add authorization header to every request if token exists
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
};
