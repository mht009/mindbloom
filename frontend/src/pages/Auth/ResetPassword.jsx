// src/pages/Auth/ResetPassword.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
  const [step, setStep] = useState(1); // 1: Request reset, 2: Verify OTP, 3: Success
  const [formData, setFormData] = useState({
    identifier: "",
    identifierType: "email",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate input
      if (!formData.identifier) {
        setError("Please enter your email or phone number");
        setLoading(false);
        return;
      }

      // Prepare request body
      const requestBody = {};
      if (formData.identifierType === "email") {
        requestBody.email = formData.identifier;
      } else {
        requestBody.phone = formData.identifier;
      }

      await axios.post("/api/auth/reset-password/request", requestBody);

      // Move to OTP verification step
      setStep(2);
      startResendCountdown();
    } catch (error) {
      console.error("Password reset request error:", error);
      if (error.response) {
        if (error.response.status === 429) {
          setError(
            `${error.response.data.message} Please try again in ${error.response.data.retryAfter} seconds.`
          );
        } else if (error.response.status === 404) {
          setError("No account found with that email/phone number");
        } else {
          setError(
            error.response.data.message || "Error sending verification code"
          );
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
      // Prepare request body
      const requestBody = {};
      if (formData.identifierType === "email") {
        requestBody.email = formData.identifier;
      } else {
        requestBody.phone = formData.identifier;
      }

      await axios.post("/api/auth/reset-password/request", requestBody);
      startResendCountdown();
    } catch (error) {
      console.error("Resend OTP error:", error);
      if (error.response) {
        if (error.response.status === 429) {
          setError(
            `${error.response.data.message} Please try again in ${error.response.data.retryAfter} seconds.`
          );
        } else {
          setError(error.response.data.message || "Failed to resend code");
        }
      } else {
        setError("Network error, please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validate inputs
      if (!formData.otp) {
        setError("Please enter the verification code");
        setLoading(false);
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      if (formData.newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      // Prepare request body
      const requestBody = {
        otp: formData.otp,
        newPassword: formData.newPassword,
      };

      if (formData.identifierType === "email") {
        requestBody.email = formData.identifier;
      } else {
        requestBody.phone = formData.identifier;
      }

      await axios.post("/api/auth/reset-password/verify", requestBody);

      // Move to success step
      setStep(3);
    } catch (error) {
      console.error("Password reset verification error:", error);
      if (error.response) {
        setError(error.response.data.message || "Error resetting password");
      } else {
        setError("Network error, please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Request password reset
  const renderRequestForm = () => (
    <form onSubmit={handleRequestReset}>
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
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800">
          Reset Your Password
        </h3>
        <p className="text-gray-600 mt-1">
          Enter your email or phone number to receive a verification code
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Reset with
        </label>
        <div className="flex space-x-4 mb-2">
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="identifierType"
              value="email"
              checked={formData.identifierType === "email"}
              onChange={handleChange}
              className="form-radio text-indigo-600"
            />
            <span className="ml-2 text-gray-700">Email</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              name="identifierType"
              value="phone"
              checked={formData.identifierType === "phone"}
              onChange={handleChange}
              className="form-radio text-indigo-600"
            />
            <span className="ml-2 text-gray-700">Phone</span>
          </label>
        </div>
        <input
          type={formData.identifierType === "email" ? "email" : "tel"}
          name="identifier"
          value={formData.identifier}
          onChange={handleChange}
          placeholder={
            formData.identifierType === "email"
              ? "Enter your email"
              : "Enter your phone number"
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>

      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        disabled={loading}
      >
        {loading ? "Sending code..." : "Send verification code"}
      </button>
    </form>
  );

  // Step 2: Verify OTP and set new password
  const renderVerifyForm = () => (
    <form onSubmit={handleVerifyAndReset}>
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
          Verify and Reset
        </h3>
        <p className="text-gray-600 mt-1">
          We've sent a verification code to {formData.identifier}
        </p>
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Verification Code
        </label>
        <input
          type="text"
          name="otp"
          value={formData.otp}
          onChange={handleChange}
          placeholder="Enter verification code"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          New Password
        </label>
        <input
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="Enter new password (min. 6 characters)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          minLength="6"
          required
        />
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Confirm New Password
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm new password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          required
        />
      </div>
      <button
        type="submit"
        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors mb-4"
        disabled={loading}
      >
        {loading ? "Resetting..." : "Reset Password"}
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

  // Step 3: Success message
  const renderSuccess = () => (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
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
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">
        Password Reset Successful
      </h3>
      <p className="text-gray-600 mb-6">
        Your password has been reset successfully. You can now log in with your
        new password.
      </p>
      <Link
        to="/login"
        className="inline-block bg-indigo-600 text-white py-2 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
      >
        Go to Login
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-yellow-100 via-pink-100 to-orange-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">
          Reset Password
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {step === 1 && renderRequestForm()}
        {step === 2 && renderVerifyForm()}
        {step === 3 && renderSuccess()}

        {step !== 3 && (
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Remember your password?{" "}
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

export default ResetPassword;
