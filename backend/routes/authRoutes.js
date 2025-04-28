const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const { Sequelize } = require("sequelize");
const otpGenerator = require("otp-generator");
const User = require("../models/mysql/user");
const router = express.Router();

// Twilio setup
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// In a production environment, these should be stored in Redis or a database
let otpStore = {};
let refreshTokenStore = {};

// OTP management functions
const setOtp = (phone, otp) => {
  otpStore[phone] = {
    otp,
    timestamp: Date.now(),
    attempts: 0, // Track verification attempts
  };
};

const checkOtpExpiry = (phone) => {
  const storedOtp = otpStore[phone];

  if (!storedOtp) {
    return { expired: true, message: "OTP not found" };
  }

  const otpExpiryTime = 5 * 60 * 1000; // 5 minutes
  const timeDifference = Date.now() - storedOtp.timestamp;

  if (timeDifference > otpExpiryTime) {
    delete otpStore[phone]; // Clean up expired OTPs
    return { expired: true, message: "OTP expired" };
  }

  return { expired: false };
};

const validateOtp = (phone, inputOtp) => {
  const expiryCheck = checkOtpExpiry(phone);
  if (expiryCheck.expired) {
    return { valid: false, message: expiryCheck.message };
  }

  // Increment attempt counter
  otpStore[phone].attempts += 1;

  // Lock after 5 failed attempts
  if (otpStore[phone].attempts > 5) {
    delete otpStore[phone]; // Remove OTP after too many attempts
    return {
      valid: false,
      message: "Too many failed attempts. Please request a new OTP.",
    };
  }

  if (otpStore[phone].otp !== inputOtp) {
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

// Input validation middleware
const validateSignupInput = (req, res, next) => {
  const { name, phone, password } = req.body;

  if (!name || !phone || !password) {
    return res
      .status(400)
      .json({ message: "Name, phone and password are required" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters" });
  }

  next();
};

// Generate OTP and send to phone
router.post("/signup", validateSignupInput, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Sequelize.Op.or]: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate OTP
    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
      alphabets: false,
      digits: true,
    });

    // Store OTP temporarily
    setOtp(phone, otp);

    // Send OTP via phone number
    const result = await sendOtpViaTwilio(phone, otp);

    if (result.success) {
      res.status(200).json({ message: "OTP sent to phone" });
    } else {
      res.status(500).json({ message: "Failed to send OTP" });
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

    // Rate limiting (basic implementation)
    // In production, use Redis with TTL or a proper rate limiter middleware
    const lastOtp = otpStore[phone];
    if (lastOtp && Date.now() - lastOtp.timestamp < 60000) {
      // 1 minute
      return res.status(429).json({
        message: "Please wait before requesting another OTP",
        retryAfter: Math.ceil(
          (60000 - (Date.now() - lastOtp.timestamp)) / 1000
        ),
      });
    }

    // Generate new OTP
    const otp = otpGenerator.generate(6, {
      upperCase: false,
      specialChars: false,
      alphabets: false,
      digits: true,
    });

    // Store new OTP with updated timestamp
    setOtp(phone, otp);

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
    const { otp, phone, name, email, password } = req.body;

    if (!otp || !phone || !name || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Validate OTP
    const otpValidation = validateOtp(phone, otp);
    if (!otpValidation.valid) {
      return res.status(400).json({ message: otpValidation.message });
    }

    // OTP is correct, hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
    });

    // Remove OTP from store after successful registration
    delete otpStore[phone];

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

    // Store refresh token
    refreshTokenStore[user.id] = refreshToken;

    res.status(201).json({
      message: "User registered successfully",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
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
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res
        .status(400)
        .json({ message: "Phone and password are required" });
    }

    // Find user
    const user = await User.findOne({ where: { phone } });
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

    // Store Refresh Token
    refreshTokenStore[user.id] = refreshToken;

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
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
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
      if (err)
        return res.status(403).json({ message: "Invalid Refresh Token" });

      const userId = decoded.userId;

      // Check if refresh token exists in our store
      if (refreshTokenStore[userId] !== refreshToken) {
        return res
          .status(403)
          .json({ message: "Refresh Token not recognized" });
      }

      // Generate new Access Token
      const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "1h",
      });

      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(500).json({ message: "Server error during token refresh" });
  }
});

// Logout route to invalidate refresh token
router.post("/logout", async (req, res) => {
  try {
    const { userId } = req.body;

    if (userId && refreshTokenStore[userId]) {
      delete refreshTokenStore[userId];
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

    // Store OTP temporarily
    setOtp(phone, otp);

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
    const otpValidation = validateOtp(phone, otp);
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

    // Remove OTP from store after successful reset
    delete otpStore[phone];

    // Invalidate all refresh tokens for this user
    if (refreshTokenStore[user.id]) {
      delete refreshTokenStore[user.id];
    }

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset verification error:", error);
    res
      .status(500)
      .json({ message: "Server error during password reset verification" });
  }
});

module.exports = router;
