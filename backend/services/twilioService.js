const twilio = require("twilio");

// Create Twilio client instance
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send OTP via Twilio SMS
 * @param {string} phone - Phone number to send OTP to
 * @param {string} otp - The OTP to send
 * @param {boolean} isResend - Whether this is a resend operation
 * @returns {Promise<Object>} - Result of the operation
 */
const sendOtp = async (phone, otp, isResend = false) => {
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

module.exports = {
  sendOtp
};
