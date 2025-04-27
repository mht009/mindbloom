const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");
const { Sequelize } = require("sequelize");
const otpGenerator = require("otp-generator");
const User = require("../models/mysql/user");
const router = express.Router();

// Twilio setup (for phone number OTP)
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Store OTP temporarily (for this demo, we use a simple object)
let otpStore = {};
// Store refresh tokens temporarily (for this demo, we use a simple object)
let refreshTokenStore = {};

// Function to set OTP in otpStore and include a timestamp
const setOtp = (phone, otp) => {
  // Store OTP in otpStore with the current timestamp
  otpStore[phone] = {
    otp,
    timestamp: Date.now(), // Store current time when OTP is generated
  };
};

// Function to check OTP expiry
const checkOtpExpiry = (phone) => {
  // Check if OTP exists for the phone number
  const storedOtp = otpStore[phone];

  if (!storedOtp) {
    return { expired: true, message: "OTP not found" };
  }

  // Check if the OTP has expired (e.g., 5 minutes expiry)
  const otpExpiryTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  const timeDifference = Date.now() - storedOtp.timestamp;

  if (timeDifference > otpExpiryTime) {
    return { expired: true, message: "OTP expired" };
  }

  return { expired: false };
};

// Function to validate OTP
const validateOtp = (phone, inputOtp) => {
  // First check if OTP has expired
  const expiryCheck = checkOtpExpiry(phone);
  if (expiryCheck.expired) {
    return { valid: false, message: expiryCheck.message };
  }

  // Then check if OTP matches
  if (otpStore[phone]?.otp !== inputOtp) {
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

// Generate OTP and send to phone
router.post("/signup", async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Check if user already exists via email or phone
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
});

// Resend OTP endpoint
router.post("/resend-otp", async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number is required" });
  }

  // Generate new OTP
  const otp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
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
});

// Verify OTP and complete registration
router.post("/verify-otp", async (req, res) => {
  const { otp, phone, name, email, password } = req.body;

  // Validate OTP
  const otpValidation = validateOtp(phone, otp);
  if (!otpValidation.valid) {
    return res.status(400).json({ message: otpValidation.message });
  }

  // OTP is correct, so we can now hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create new user with email (optional) and phone
  const user = await User.create({
    name,
    email, // Email is stored but not used for OTP
    phone,
    password: hashedPassword,
  });

  // Remove OTP from store after successful registration
  delete otpStore[phone];

  // Generate JWT token
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.status(201).json({ token, user });
});

// Login
router.post("/login", async (req, res) => {
  const { phone, password } = req.body;

  // Find user
  const user = await User.findOne({ where: { phone } });
  if (!user) return res.status(404).json({ message: "User not found" });

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ message: "Invalid password" });

  // Generate Access Token
  const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
    expiresIn: "1h", // Access token valid for 1 hour
  });

  // Generate Refresh Token
  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d", // Refresh token valid for 7 days
    }
  );

  // Store Refresh Token
  refreshTokenStore[user.id] = refreshToken;

  res.status(200).json({ accessToken, refreshToken, user });
});

// Refresh Token Route
router.post("/refresh-token", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken)
    return res.status(401).json({ message: "Refresh Token required" });

  // Verify refresh token
  jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid Refresh Token" });

    const userId = decoded.userId;

    // Check if refresh token exists in our store
    if (refreshTokenStore[userId] !== refreshToken) {
      return res.status(403).json({ message: "Refresh Token not recognized" });
    }

    // Generate new Access Token
    const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    res.status(200).json({ accessToken: newAccessToken });
  });
});

// Generate OTP for password reset
router.post("/reset-password/request", async (req, res) => {
  const { phone } = req.body;

  // Check if the user exists
  const user = await User.findOne({ where: { phone } });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Generate OTP
  const otp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
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
});

// Verify OTP and reset password
router.post("/reset-password/verify", async (req, res) => {
  const { otp, phone, newPassword } = req.body;

  // Validate OTP
  const otpValidation = validateOtp(phone, otp);
  if (!otpValidation.valid) {
    return res.status(400).json({ message: otpValidation.message });
  }

  // OTP is correct, so hash the new password
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

  res.status(200).json({ message: "Password reset successfully" });
});

module.exports = router;
