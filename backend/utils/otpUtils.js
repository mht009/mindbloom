const otpGenerator = require("otp-generator");
const redisClient = require("../config/redisClient");
const twilioService = require("../services/twilioService");
// Note: emailService would be imported here when implemented

// Redis Key Pattern for OTP
const OTP_KEY_PREFIX = "otp:";

/**
 * Generate a numeric OTP
 * @returns {string} Generated OTP
 */
const generateOtp = () => {
  return otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
    alphabets: false,
    digits: true,
  });
};

/**
 * Store OTP in Redis with expiry
 * @param {string} identifier - User identifier (phone/email)
 * @param {string} otp - The OTP to store
 * @param {number} expirySeconds - Expiry time in seconds
 * @returns {Promise<void>}
 */
const storeOtp = async (identifier, otp, expirySeconds = 300) => {
  const otpData = {
    otp,
    attempts: 0,
  };

  // Store OTP with expiry (default 5 minutes)
  await redisClient.setEx(
    `${OTP_KEY_PREFIX}${identifier}`,
    expirySeconds,
    JSON.stringify(otpData)
  );
};

/**
 * Check if an OTP has expired
 * @param {string} identifier - User identifier (phone/email)
 * @returns {Promise<Object>} Result of expiry check
 */
const checkOtpExpiry = async (identifier) => {
  const otpData = await redisClient.get(`${OTP_KEY_PREFIX}${identifier}`);

  if (!otpData) {
    return { expired: true, message: "OTP not found or expired" };
  }

  return { expired: false };
};

/**
 * Check if a request to generate a new OTP is within rate limits
 * @param {string} identifier - User identifier (phone/email)
 * @returns {Promise<Object>} Rate limit check result
 */
const checkOtpRateLimit = async (identifier) => {
  // Check if an OTP was recently generated
  const otpData = await redisClient.get(`${OTP_KEY_PREFIX}${identifier}`);

  if (otpData) {
    // Check if OTP was created within the last minute
    const ttl = await redisClient.ttl(`${OTP_KEY_PREFIX}${identifier}`);
    if (ttl > 240) {
      // 300 - 60 = 240 (if more than 4 minutes remaining, less than 1 minute has passed)
      return {
        rateLimited: true,
        message: "Please wait before requesting another OTP",
        retryAfter: 300 - ttl, // Time in seconds to wait
      };
    }
  }

  return { rateLimited: false };
};

/**
 * Validate an OTP input by a user
 * @param {string} identifier - User identifier (phone/email)
 * @param {string} inputOtp - The OTP provided by the user
 * @returns {Promise<Object>} Validation result
 */
const validateOtp = async (identifier, inputOtp) => {
  const expiryCheck = await checkOtpExpiry(identifier);
  if (expiryCheck.expired) {
    return { valid: false, message: expiryCheck.message };
  }

  const otpData = JSON.parse(
    await redisClient.get(`${OTP_KEY_PREFIX}${identifier}`)
  );

  // Increment attempt counter
  otpData.attempts += 1;

  // Lock after 5 failed attempts
  if (otpData.attempts > 5) {
    await redisClient.del(`${OTP_KEY_PREFIX}${identifier}`);
    return {
      valid: false,
      message: "Too many failed attempts. Please request a new OTP.",
    };
  }

  // Update attempts in Redis
  await redisClient.setEx(
    `${OTP_KEY_PREFIX}${identifier}`,
    300, // Reset TTL to 5 minutes
    JSON.stringify(otpData)
  );

  if (otpData.otp !== inputOtp) {
    return { valid: false, message: "Invalid OTP" };
  }

  return { valid: true };
};

/**
 * Remove OTP from Redis after successful verification
 * @param {string} identifier - User identifier (phone/email)
 * @returns {Promise<void>}
 */
const removeOtp = async (identifier) => {
  await redisClient.del(`${OTP_KEY_PREFIX}${identifier}`);
};

/**
 * Send OTP to a user via their chosen channel (phone/email)
 * @param {string} identifier - User identifier (phone/email)
 * @param {string} channel - The channel to use ('phone' or 'email')
 * @param {boolean} isResend - Whether this is a resend operation
 * @returns {Promise<Object>} Result of the send operation
 */
const sendOtp = async (identifier, channel = "phone", isResend = false) => {
  // Check rate limit
  const rateLimitCheck = await checkOtpRateLimit(identifier);
  if (rateLimitCheck.rateLimited) {
    return rateLimitCheck;
  }

  // Generate OTP
  const otp = generateOtp();

  // Store OTP
  await storeOtp(identifier, otp);

  // Send via appropriate channel
  if (channel === "phone") {
    return await twilioService.sendOtp(identifier, otp, isResend);
  }
  /* When email service is implemented
  else if (channel === 'email') {
    return await emailService.sendOtp(identifier, otp, isResend);
  }
  */

  return { success: false, message: "Invalid channel specified" };
};

module.exports = {
  generateOtp,
  sendOtp,
  validateOtp,
  checkOtpExpiry,
  removeOtp,
  checkOtpRateLimit,
};
