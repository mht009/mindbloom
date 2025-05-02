/**
 * Email service for sending OTPs and notifications
 * (This is a placeholder file for future implementation)
 */

/**
 * Send OTP via email
 * @param {string} email - Email address to send OTP to
 * @param {string} otp - The OTP to send
 * @param {boolean} isResend - Whether this is a resend operation
 * @returns {Promise<Object>} - Result of the operation
 */
const sendOtp = async (email, otp, isResend = false) => {
  // This functionality will be implemented in the future
  console.log(`[PLACEHOLDER] Sending ${isResend ? "resent " : ""}OTP ${otp} to ${email}`);
  
  // For now, we'll simulate success
  return { success: true };
};

module.exports = {
  sendOtp
};
