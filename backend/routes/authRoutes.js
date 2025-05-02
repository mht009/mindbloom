const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const { Sequelize } = require("sequelize");
const otpGenerator = require("otp-generator");
const User = require("../models/mysql/user");
const router = express.Router();
const redisClient = require("../config/redisClient");
const esClient = require("../config/esClient");

// Twilio setup
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Redis Key Patterns
const OTP_KEY_PREFIX = "otp:";
const REFRESH_TOKEN_PREFIX = "refresh:";
const ACCESS_TOKEN_PREFIX = "access:";

// OTP management functions with Redis
const setOtp = async (phone, otp) => {
  const otpData = {
    otp,
    attempts: 0,
  };

  // Store OTP with 5 minute expiry
  await redisClient.setEx(
    `${OTP_KEY_PREFIX}${phone}`,
    300, // 5 minutes in seconds
    JSON.stringify(otpData)
  );
};

const checkOtpExpiry = async (phone) => {
  const otpData = await redisClient.get(`${OTP_KEY_PREFIX}${phone}`);

  if (!otpData) {
    return { expired: true, message: "OTP not found or expired" };
  }

  return { expired: false };
};

const validateOtp = async (phone, inputOtp) => {
  const expiryCheck = await checkOtpExpiry(phone);
  if (expiryCheck.expired) {
    return { valid: false, message: expiryCheck.message };
  }

  const otpData = JSON.parse(
    await redisClient.get(`${OTP_KEY_PREFIX}${phone}`)
  );

  // Increment attempt counter
  otpData.attempts += 1;

  // Lock after 5 failed attempts
  if (otpData.attempts > 5) {
    await redisClient.del(`${OTP_KEY_PREFIX}${phone}`);
    return {
      valid: false,
      message: "Too many failed attempts. Please request a new OTP.",
    };
  }

  // Update attempts in Redis
  await redisClient.setEx(
    `${OTP_KEY_PREFIX}${phone}`,
    300, // Reset TTL to 5 minutes
    JSON.stringify(otpData)
  );

  if (otpData.otp !== inputOtp) {
    return { valid: false, message: "Invalid OTP" };
  }

  return { valid: true };
};

// Helper function to send OTP via Twilio
const sendOtpViaTwilio = async (phone, otp, isResend = false) => {
  try {
    await twilioClient.messages.create({
      body: `Your OTP for mindbloom ${
        isResend ? "is resent" : "registration/password change is"
      } ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return { success: true };
  } catch (err) {
    console.error("Twilio Error:", err);
    return { success: false, error: err };
  }
};

// Token management with Redis
const storeTokens = async (userId, accessToken, refreshToken) => {
  // Store access token with 1 hour expiry
  await redisClient.setEx(
    `${ACCESS_TOKEN_PREFIX}${userId}`,
    3600, // 1 hour in seconds
    accessToken
  );

  // Store refresh token with 7 days expiry
  await redisClient.setEx(
    `${REFRESH_TOKEN_PREFIX}${userId}`,
    604800, // 7 days in seconds
    refreshToken
  );
};

const validateRefreshToken = async (userId, token) => {
  const storedToken = await redisClient.get(`${REFRESH_TOKEN_PREFIX}${userId}`);
  return storedToken === token;
};

const removeTokens = async (userId) => {
  await redisClient.del(`${ACCESS_TOKEN_PREFIX}${userId}`);
  await redisClient.del(`${REFRESH_TOKEN_PREFIX}${userId}`);
};

// Generate username suggestions
const generateUsernameSuggestions = async (username) => {
  const suggestions = [];

  // Add a random number to the end
  suggestions.push(`${username}${Math.floor(Math.random() * 1000)}`);

  // Add underscores
  suggestions.push(`${username}_${Math.floor(Math.random() * 100)}`);

  // Try adding the current year
  const currentYear = new Date().getFullYear();
  suggestions.push(`${username}${currentYear}`);

  // Try "real" or "official" prefix
  suggestions.push(`real_${username}`);

  // Check if these suggestions are available
  const availableSuggestions = [];

  for (const suggestion of suggestions) {
    // Quick check in MySQL
    const exists = await User.findOne({ where: { username: suggestion } });
    if (!exists) {
      availableSuggestions.push(suggestion);
      if (availableSuggestions.length >= 3) break; // Limit to 3 suggestions
    }
  }

  return availableSuggestions;
};

// Check username availability with suggestions
const checkUsernameAvailability = async (username) => {
  try {
    // Check MySQL database
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      // If username is taken, generate some suggestions
      const suggestions = await generateUsernameSuggestions(username);
      return { available: false, source: "database", suggestions };
    }

    // Check Elasticsearch
    try {
      const { body } = await esClient.search({
        index: "users",
        body: {
          query: {
            match: {
              username: username,
            },
          },
        },
      });

      if (body.hits.total.value > 0) {
        // If username is taken, generate some suggestions
        const suggestions = await generateUsernameSuggestions(username);
        return {
          available: false,
          source: "elasticsearch",
          suggestions,
        };
      }

      return { available: true };
    } catch (esError) {
      console.error("Elasticsearch error:", esError);
      // Default to database check if Elasticsearch fails
      return { available: true, esError: esError.message };
    }
  } catch (error) {
    console.error("Username availability check error:", error);
    throw error;
  }
};

// Input validation middleware
const validateSignupInput = (req, res, next) => {
  const { name, username, phone, email, password } = req.body;

  if (!name || !username || !password || (!phone && !email)) {
    return res.status(400).json({
      message:
        "Name, username, password, and either phone or email are required",
    });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  next();
};

// Check username availability endpoint
router.get("/check-username/:username", async (req, res) => {
  try {
    const { username } = req.params;

    if (!username) {
      return res.status(400).json({ message: "Username is required" });
    }

    const result = await checkUsernameAvailability(username);

    if (result.available) {
      return res.status(200).json({
        available: true,
        message: "Username is available",
        suggestions: result.suggestions || [],
      });
    } else {
      return res.status(200).json({
        available: false,
        message: "Username is already taken",
        suggestions: result.suggestions || [],
      });
    }
  } catch (error) {
    console.error("Username check error:", error);
    res.status(500).json({ message: "Server error during username check" });
  }
});

// Generate OTP and send to phone
router.post("/signup", validateSignupInput, async (req, res) => {
  try {
    const { name, username, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Sequelize.Op.or]: [
          { username },
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      let message = "User already exists";
      if (existingUser.username === username)
        message = "Username is already taken";
      else if (email && existingUser.email === email)
        message = "Email is already registered";
      else if (phone && existingUser.phone === phone)
        message = "Phone number is already registered";

      return res.status(400).json({ message });
    }

    // Generate OTP if phone is provided
    if (phone) {
      // Generate OTP
      const otp = otpGenerator.generate(6, {
        upperCase: false,
        specialChars: false,
        alphabets: false,
        digits: true,
      });

      // Store OTP in Redis
      await setOtp(phone, otp);

      // Send OTP via phone number
      const result = await sendOtpViaTwilio(phone, otp);

      if (result.success) {
        return res.status(200).json({
          message: "OTP sent to phone",
          userData: { name, username, email, phone }, // Return the data for client to use in verification
        });
      } else {
        return res.status(500).json({ message: "Failed to send OTP" });
      }
    } else {
      // If no phone is provided, proceed with email-based signup
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await User.create({
        name,
        username,
        email,
        phone,
        password: hashedPassword,
      });

      // Generate tokens
      const accessToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        {
          expiresIn: "1h",
        }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
      );

      // Store tokens in Redis
      await storeTokens(user.id, accessToken, refreshToken);

      // Store user in Elasticsearch
      await esClient.index({
        index: "users",
        id: user.id.toString(),
        body: {
          userId: user.id,
          username: user.username.toLowerCase(),
          name: user.name,
          email: user.email,
          createdAt: new Date(),
        },
        refresh: true, // Make sure document is available for search immediately
      });

      return res.status(201).json({
        message: "User registered successfully",
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          username: user.username,
          phone: user.phone,
          email: user.email,
        },
      });
    }
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

// Resend OTP endpoint
router.post("/resend-otp", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Rate limiting check via Redis
    const otpData = await redisClient.get(`${OTP_KEY_PREFIX}${phone}`);
    if (otpData) {
      // Check if OTP was created within the last minute
      const ttl = await redisClient.ttl(`${OTP_KEY_PREFIX}${phone}`);
      if (ttl > 240) {
        // 300 - 60 = 240 (if more than 4 minutes remaining, less than 1 minute has passed)
        return res.status(429).json({
          message: "Please wait before requesting another OTP",
          retryAfter: 300 - ttl, // Time in seconds to wait
        });
      }
    }

    // Generate new OTP
    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
      alphabets: false,
      digits: true,
    });

    // Store new OTP in Redis
    await setOtp(phone, otp);

    // Send OTP via Twilio
    const result = await sendOtpViaTwilio(phone, otp, true);

    if (result.success) {
      res.status(200).json({ message: "OTP resent successfully" });
    } else {
      res.status(500).json({ message: "Failed to resend OTP" });
    }
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Server error during OTP resend" });
  }
});

// Verify OTP and complete registration
router.post("/verify-otp", async (req, res) => {
  try {
    const { otp, phone, name, username, email, password } = req.body;

    if (!otp || !phone || !name || !username || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate OTP
    const otpValidation = await validateOtp(phone, otp);
    if (!otpValidation.valid) {
      return res.status(400).json({ message: otpValidation.message });
    }

    // Check if user already exists (double check in case someone registered in between)
    const existingUser = await User.findOne({
      where: {
        [Sequelize.Op.or]: [
          { username },
          ...(email ? [{ email }] : []),
          { phone },
        ],
      },
    });

    if (existingUser) {
      let message = "User already exists";
      if (existingUser.username === username)
        message = "Username is already taken";
      else if (email && existingUser.email === email)
        message = "Email is already registered";
      else if (existingUser.phone === phone)
        message = "Phone number is already registered";

      return res.status(400).json({ message });
    }

    // OTP is correct, hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      username,
      email,
      phone,
      password: hashedPassword,
    });

    // Remove OTP from Redis after successful registration
    await redisClient.del(`${OTP_KEY_PREFIX}${phone}`);

    // Generate JWT token
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Generate refresh token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Store tokens in Redis
    await storeTokens(user.id, accessToken, refreshToken);

    // Store user in Elasticsearch
    await esClient.index({
      index: "users",
      id: user.id.toString(),
      body: {
        userId: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        createdAt: new Date(),
      },
      refresh: true, // Make sure document is available for search immediately
    });

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res.status(500).json({ message: "Server error during OTP verification" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { username, phone, email, password } = req.body;

    if ((!username && !phone && !email) || !password) {
      return res.status(400).json({
        message:
          "Login identifier (username, phone, or email) and password are required",
      });
    }

    // Find user by username, phone, or email
    const whereClause = {};
    if (username) whereClause.username = username;
    if (phone) whereClause.phone = phone;
    if (email) whereClause.email = email;

    // Find user
    const user = await User.findOne({ where: whereClause });

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    // Generate Access Token
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Generate Refresh Token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    // Store tokens in Redis
    await storeTokens(user.id, accessToken, refreshToken);

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});

// Refresh Token Route
router.post("/refresh-token", async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh Token required" });
    }

    // Verify refresh token
    jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET,
      async (err, decoded) => {
        if (err)
          return res.status(403).json({ message: "Invalid Refresh Token" });

        const userId = decoded.userId;

        // Check if refresh token exists in Redis
        const isValid = await validateRefreshToken(userId, refreshToken);
        if (!isValid) {
          return res
            .status(403)
            .json({ message: "Refresh Token not recognized or expired" });
        }

        // Generate new Access Token
        const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
          expiresIn: "1h",
        });

        // Update access token in Redis
        await redisClient.setEx(
          `${ACCESS_TOKEN_PREFIX}${userId}`,
          3600, // 1 hour in seconds
          newAccessToken
        );

        res.status(200).json({ accessToken: newAccessToken });
      }
    );
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Server error during token refresh" });
  }
});

// Logout route to invalidate tokens
router.post("/logout", async (req, res) => {
  try {
    const { userId } = req.body;

    if (userId) {
      // Remove tokens from Redis
      await removeTokens(userId);
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
});

// Generate OTP for password reset
router.post("/reset-password/request", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Check if the user exists
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
      alphabets: false,
      digits: true,
    });

    // Store OTP in Redis
    await setOtp(phone, otp);

    // Send OTP via phone
    const result = await sendOtpViaTwilio(phone, otp);

    if (result.success) {
      res.status(200).json({ message: "OTP sent to phone" });
    } else {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (error) {
    console.error("Password reset request error:", error);
    res
      .status(500)
      .json({ message: "Server error during password reset request" });
  }
});

// Verify OTP and reset password
router.post("/reset-password/verify", async (req, res) => {
  try {
    const { otp, phone, newPassword } = req.body;

    if (!otp || !phone || !newPassword) {
      return res
        .status(400)
        .json({ message: "OTP, phone and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // Validate OTP
    const otpValidation = await validateOtp(phone, otp);
    if (!otpValidation.valid) {
      return res.status(400).json({ message: otpValidation.message });
    }

    // OTP is correct, hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    const user = await User.findOne({ where: { phone } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = hashedPassword;
    await user.save();

    // Remove OTP from Redis after successful reset
    await redisClient.del(`${OTP_KEY_PREFIX}${phone}`);

    // Invalidate all tokens for this user
    await removeTokens(user.id);

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset verification error:", error);
    res
      .status(500)
      .json({ message: "Server error during password reset verification" });
  }
});

module.exports = router;
