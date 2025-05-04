// src/pages/Auth/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const Signup = () => {
  const [step, setStep] = useState(1); // 1: Initial signup, 2: OTP verification
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear username availability when username changes
    if (name === "username") {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
    }
  };

  const checkUsername = async () => {
    if (!formData.username) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `/api/auth/check-username/${formData.username}`
      );
      setUsernameAvailable(response.data.available);
      setUsernameSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error("Username check error:", error);
      setError("Error checking username availability");
    } finally {
      setLoading(false);
    }
  };

  const startResendCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Password confirmation check
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      // Username availability check
      if (usernameAvailable === false) {
        setError("Username is not available");
        setLoading(false);
        return;
      }

      // Require either email or phone
      if (!formData.email && !formData.phone) {
        setError("Please provide either email or phone number");
        setLoading(false);
        return;
      }

      const response = await axios.post("/api/auth/signup", {
        name: formData.name,
        username: formData.username,
        email: formData.email || null,
        phone: formData.phone || null,
        password: formData.password,
      });

      if (response.data.userData) {
        // OTP was sent, move to OTP verification step
        setOtpSent(true);
        setStep(2);
        startResendCountdown();
      } else {
        // Direct signup (for email-based registration without OTP)
        localStorage.setItem("accessToken", response.data.accessToken);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem("user", JSON.stringify(response.data.user));

        // Redirect to dashboard
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Signup error:", error);
      if (error.response) {
        if (error.response.status === 429) {
          setError(
            `${error.response.data.message} Please try again in ${error.response.data.retryAfter} seconds.`
          );
        } else {
          setError(error.response.data.message || "Signup failed");
        }
      } else {
        setError("Network error, please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/api/auth/resend-otp", {
        phone: formData.phone,
        email: formData.email,
      });

      setOtpSent(true);
      startResendCountdown();
    } catch (error) {
      console.error("Resend OTP error:", error);
      if (error.response) {
        if (error.response.status === 429) {
          setError(
            `${error.response.data.message} Please try again in ${error.response.data.retryAfter} seconds.`
          );
        } else {
          setError(error.response.data.message || "Failed to resend OTP");
        }
      } else {
        setError("Network error, please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/api/auth/verify-otp", {
        otp,
        phone: formData.phone,
        email: formData.email,
        name: formData.name,
        username: formData.username,
        password: formData.password,
      });

      // Store tokens in localStorage
      localStorage.setItem("accessToken", response.data.accessToken);
      localStorage.setItem("refreshToken", response.data.refreshToken);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("OTP verification error:", error);
      if (error.response) {
        setError(error.response.data.message || "OTP verification failed");
      } else {
        setError("Network error, please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const applyUsernameSuggestion = (suggestion) => {
    setFormData({ ...formData, username: suggestion });
    setUsernameAvailable(true);
  };

  // First step: Registration form
  const renderSignupForm = () => (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Full Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Username
          {usernameAvailable !== null && (
            <span
              className={`ml-2 text-sm ${
                usernameAvailable ? "text-green-600" : "text-red-600"
              }`}
            >
              {usernameAvailable ? "✓ Available" : "✗ Not available"}
            </span>
          )}
        </label>
        <div className="flex">
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Choose a username"
            className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <button
            type="button"
            onClick={checkUsername}
            className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-r-md focus:outline-none transition-colors"
          >
            Check
          </button>
        </div>

        {usernameSuggestions.length > 0 && !usernameAvailable && (
          <div className="mt-2">
            <p className="text-sm text-gray-700">Suggestions:</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {usernameSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => applyUsernameSuggestion(suggestion)}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm px-3 py-1 rounded-full"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Email (Optional)
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Phone Number
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Enter your phone number"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Password
        </label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Create a password (min. 6 characters)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          minLength="6"
          required
        />
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm your password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        disabled={loading}
      >
        {loading ? "Processing..." : "Sign Up"}
      </button>
    </form>
  );

  // Second step: OTP verification
  const renderOtpVerification = () => (
    <form onSubmit={handleVerifyOtp}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800">
          Verify Your {formData.phone ? "Phone Number" : "Email"}
        </h3>
        <p className="text-gray-600 mt-1">
          We've sent a verification code to {formData.phone || formData.email}
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Verification Code
        </label>
        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter verification code"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors mb-4"
        disabled={loading}
      >
        {loading ? "Verifying..." : "Verify & Complete Registration"}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={countdown > 0 || loading}
          className={`text-indigo-600 hover:text-indigo-700 ${
            countdown > 0 || loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {countdown > 0
            ? `Resend code in ${countdown}s`
            : "Resend verification code"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-yellow-100 via-pink-100 to-orange-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">
          {step === 1 ? "Create Your Account" : "Verify Your Account"}
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 1 ? renderSignupForm() : renderOtpVerification()}

        {step === 1 && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-indigo-600 hover:text-indigo-700"
              >
                Login
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Signup;
