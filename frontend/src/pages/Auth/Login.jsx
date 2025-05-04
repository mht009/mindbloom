// src/pages/Auth/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const Login = () => {
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });
  const [identifierType, setIdentifierType] = useState("username");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleIdentifierTypeChange = (e) => {
    setIdentifierType(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Build request body based on identifier type
      const requestBody = {
        password: formData.password,
      };

      // Set the appropriate identifier field based on selection
      if (identifierType === "username") {
        requestBody.username = formData.identifier;
      } else if (identifierType === "email") {
        requestBody.email = formData.identifier;
      } else if (identifierType === "phone") {
        requestBody.phone = formData.identifier;
      }

      const response = await axios.post("/api/auth/login", requestBody);

      // Use the login function from auth context to update state
      login(response.data.user, {
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      });

      // Navigate to home page
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      if (error.response) {
        setError(error.response.data.message || "Login failed");
      } else {
        setError("Network error, please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-yellow-100 via-pink-100 to-orange-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-indigo-700 mb-6">
          Welcome Back
        </h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Login with
            </label>
            <div className="flex space-x-4 mb-2">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="username"
                  checked={identifierType === "username"}
                  onChange={handleIdentifierTypeChange}
                  className="form-radio text-indigo-600"
                />
                <span className="ml-2 text-gray-700">Username</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="email"
                  checked={identifierType === "email"}
                  onChange={handleIdentifierTypeChange}
                  className="form-radio text-indigo-600"
                />
                <span className="ml-2 text-gray-700">Email</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="phone"
                  checked={identifierType === "phone"}
                  onChange={handleIdentifierTypeChange}
                  className="form-radio text-indigo-600"
                />
                <span className="ml-2 text-gray-700">Phone</span>
              </label>
            </div>
            <input
              type={identifierType === "email" ? "email" : "text"}
              name="identifier"
              placeholder={
                identifierType === "username"
                  ? "Enter username"
                  : identifierType === "email"
                  ? "Enter email"
                  : "Enter phone number"
              }
              value={formData.identifier}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <div className="text-right mt-1">
              <Link
                to="/reset-password"
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-indigo-600 hover:text-indigo-700"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
