// src/context/AuthContext.jsx
import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from "react";
import {
  refreshTokenService,
  logoutService,
  setupAxiosInterceptors,
  isTokenExpired,
} from "./authUtils";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Use refs to break dependency cycles
  const userRef = useRef();
  const isRefreshingRef = useRef(false);

  // Update refs when state changes
  useEffect(() => {
    userRef.current = user;
    isRefreshingRef.current = isRefreshing;
  }, [user, isRefreshing]);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshingRef.current) return false;

    setIsRefreshing(true);
    isRefreshingRef.current = true;

    try {
      const currentRefreshToken = localStorage.getItem("refreshToken");

      if (!currentRefreshToken) {
        throw new Error("No refresh token available");
      }

      // Check if refresh token is expired
      if (isTokenExpired(currentRefreshToken)) {
        throw new Error("Refresh token expired");
      }

      const newAccessToken = await refreshTokenService(currentRefreshToken);

      if (newAccessToken) {
        localStorage.setItem("accessToken", newAccessToken);
        setIsRefreshing(false);
        isRefreshingRef.current = false;
        return true;
      }

      // If we didn't get a new token, log the user out
      await logout();
      setIsRefreshing(false);
      isRefreshingRef.current = false;
      return false;
    } catch (error) {
      console.error("Token refresh failed:", error);
      // Any failure should result in logout
      await logout();
      setIsRefreshing(false);
      isRefreshingRef.current = false;
      return false;
    }
  }, []);

  // Login function
  const login = useCallback((userData, tokens) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("accessToken", tokens.accessToken);
    localStorage.setItem("refreshToken", tokens.refreshToken);
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      const userId = userRef.current?.id;
      if (userId) {
        await logoutService(userId);
      }
    } catch (error) {
      console.error("Error during logout service:", error);
    } finally {
      // Clear user data and tokens regardless of server response
      setUser(null);
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    }
  }, []);

  // Initialize auth state once on component mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // Check if user is already logged in (from localStorage)
      const storedUser = localStorage.getItem("user");
      const accessToken = localStorage.getItem("accessToken");
      const refreshTokenValue = localStorage.getItem("refreshToken");

      if (storedUser && accessToken && isMounted) {
        // Check if the access token is expired
        if (isTokenExpired(accessToken)) {
          // Try to refresh the token if it's expired
          if (refreshTokenValue && !isTokenExpired(refreshTokenValue)) {
            const success = await refreshToken();
            if (success && isMounted) {
              setUser(JSON.parse(storedUser));
            }
          } else if (isMounted) {
            // If refresh token is also expired or missing, log the user out
            await logout();
          }
        } else if (isMounted) {
          // If access token is still valid, set the user
          setUser(JSON.parse(storedUser));
        }
      }

      // Setup axios interceptors for automatic token refresh
      const removeInterceptors = setupAxiosInterceptors(refreshToken);

      if (isMounted) {
        setLoading(false);
      }

      return removeInterceptors;
    };

    const cleanup = initializeAuth();

    // Cleanup function
    return () => {
      isMounted = false;
      if (typeof cleanup === "function") {
        cleanup();
      }
    };
  }, []); // Empty dependency array - run once on mount

  // Set up a timer to check token expiration periodically
  useEffect(() => {
    // Check token validity every minute
    const tokenCheckInterval = setInterval(() => {
      const accessToken = localStorage.getItem("accessToken");

      if (userRef.current && accessToken && isTokenExpired(accessToken)) {
        // If token is expired, try to refresh it
        refreshToken();
      }
    }, 60000); // Check every minute

    return () => clearInterval(tokenCheckInterval);
  }, []); // Empty dependency array - set up once on mount

  const contextValue = {
    user,
    login,
    logout,
    loading,
    refreshToken,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
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
