# API Documentation for Authentication

This document provides detailed information about the authentication-related API endpoints for the mindbloom application. It includes endpoint descriptions, request/response formats, authentication requirements, and error handling to assist frontend developers in integrating with the backend. This version reflects updates to the authentication API, including input validation, attempt limits for OTP verification, rate limiting for OTP resends, and a logout endpoint.

## Base URL

All API endpoints are relative to the base URL:  
`https://api.mindbloom.com`

## Authentication

- **JWT Tokens**: Most endpoints require a JSON Web Token (JWT) for authentication, provided in the `Authorization` header as `Bearer <token>`.
- **Refresh Tokens**: Used to obtain new access tokens when the current access token expires. Stored temporarily in memory for this implementation (in production, use Redis or a database).
- **OTP**: One-Time Passwords are used for signup and password reset verification, with a 5-minute expiry and a maximum of 5 verification attempts.

## Endpoints

### 1. Signup (Request OTP)

Initiates the signup process by generating and sending an OTP to the user's phone number.

- **URL**: `/signup`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:

  ```json
  {
    "name": "string",
    "email": "string | null",
    "phone": "string",
    "password": "string"
  }
  ```

  - `name`: User's full name (required, min 2 characters).
  - `email`: User's email address (optional, must be valid if provided).
  - `phone`: User's phone number in international format (e.g., `+1234567890`, required).
  - `password`: User's password (required, min 6 characters).

- **Response**:
  - **Success (200)**:

    ```json
    {
      "message": "OTP sent to phone"
    }
    ```

  - **Error (400)**:

    ```json
    {
      "message": "Name, phone and password are required"
    }
    ```

    ```json
    {
      "message": "Password must be at least 6 characters"
    }
    ```

    ```json
    {
      "message": "User already exists"
    }
    ```

  - **Error (500)**:

    ```json
    {
      "message": "Failed to send OTP"
    }
    ```

    ```json
    {
      "message": "Server error during signup"
    }
    ```
- **Notes**:
  - The phone number must be unique and not already registered.
  - Email is optional but must be unique if provided.
  - The OTP is sent via SMS using Twilio, is 6 digits, and is valid for 5 minutes.
  - Input validation ensures `name`, `phone`, and `password` are provided, and `password` is at least 6 characters.

### 2. Resend OTP

Resends a new OTP to the user's phone number.

- **URL**: `/resend-otp`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:

  ```json
  {
    "phone": "string"
  }
  ```

  - `phone`: User's phone number in international format (required).

- **Response**:
  - **Success (200)**:

    ```json
    {
      "message": "OTP resent successfully"
    }
    ```

  - **Error (400)**:

    ```json
    {
      "message": "Phone number is required"
    }
    ```

  - **Error (429)**:

    ```json
    {
      "message": "Please wait before requesting another OTP",
      "retryAfter": number
    }

    ```

  - **Error (500)**:

    ```json
    {
      "message": "Failed to resend OTP"
    }
    ```

    ```json
    {
      "message": "Server error during OTP resend"
    }
    ```
- **Notes**:
  - Use this endpoint if the user did not receive the OTP or it expired.
  - A basic rate limit prevents OTP resends within 1 minute of the last request.
  - The new OTP replaces the previous one, is 6 digits, and is valid for 5 minutes.

### 3. Verify OTP (Complete Signup)

Verifies the OTP and completes the user registration process.

- **URL**: `/verify-otp`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:

  ```json
  {
    "otp": "string",
    "phone": "string",
    "name": "string",
    "email": "string | null",
    "password": "string"
  }
  ```

  - `otp`: 6-digit OTP received via SMS (required).
  - `phone`: User's phone number (required).
  - `name`: User's full name (required).
  - `email`: User's email address (optional).
  - `password`: User's password (required, min 6 characters).

- **Response**:
  - **Success (201)**:

    ```json
    {
      "message": "User registered successfully",
      "accessToken": "string",
      "refreshToken": "string",
      "user": {
        "id": "number",
        "name": "string",
        "phone": "string",
        "email": "string | null"
      }
    }
    ```

  - **Error (400)**:

    ```json
    {
      "message": "Missing required fields"
    }
    ```

    ```json
    {
      "message": "Invalid OTP"
    }
    ```

    ```json
    {
      "message": "OTP expired"
    }
    ```

    ```json
    {
      "message": "OTP not found"
    }
    ```

    ```json
    {
      "message": "Too many failed attempts. Please request a new OTP."
    }
    ```

  - **Error (500)**:

    ```json
    {
      "message": "Server error during OTP verification"
    }
    ```
- **Notes**:
  - The same `name`, `email`, `phone`, and `password` from the `/signup` request must be provided.
  - The OTP must match the one sent to the phone, not be expired, and have fewer than 5 failed attempts.
  - Upon successful verification, an access token (valid for 1 hour) and a refresh token (valid for 7 days) are returned.
  - The OTP is removed from the server after successful registration.

### 4. Login

Authenticates a user and returns access and refresh tokens.

- **URL**: `/login`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:

  ```json
  {
    "phone": "string",
    "password": "string"
  }
  ```

  - `phone`: User's phone number (required).
  - `password`: User's password (required).

- **Response**:
  - **Success (200)**:

    ```json
    {
      "accessToken": "string",
      "refreshToken": "string",
      "user": {
        "id": "number",
        "name": "string",
        "phone": "string",
        "email": "string | null"
      }
    }
    ```

  - **Error (400)**:

    ```json
    {
      "message": "Phone and password are required"
    }
    ```

    ```json
    {
      "message": "Invalid password"
    }
    ```

  - **Error (404)**:

    ```json
    {
      "message": "User not found"
    }
    ```

  - **Error (500)**:

    ```json
    {
      "message": "Server error during login"
    }
    ```
- **Notes**:
  - The `accessToken` is valid for 1 hour.
  - The `refreshToken` is valid for 7 days and should be stored securely (e.g., in HTTP-only cookies).
  - Use the `accessToken` in the `Authorization` header for authenticated requests.

### 5. Refresh Token

Obtains a new access token using a refresh token.

- **URL**: `/refresh-token`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:

  ```json
  {
    "refreshToken": "string"
  }
  ```

  - `refreshToken`: Refresh token received during login or signup (required).

- **Response**:
  - **Success (200)**:

    ```json
    {
      "accessToken": "string"
    }
    ```

  - **Error (401)**:

    ```json
    {
      "message": "Refresh Token required"
    }
    ```

  - **Error (403)**:

    ```json
    {
      "message": "Invalid Refresh Token"
    }
    ```

    ```json
    {
      "message": "Refresh Token not recognized"
    }
    ```

  - **Error (500)**:

    ```json
    {
      "message": "Server error during token refresh"
    }
    ```
- **Notes**:
  - The new `accessToken` is valid for 1 hour.
  - The `refreshToken` must be valid and match the one stored on the server.
  - If the refresh token is invalid or expired, the user must log in again.

### 6. Logout

Invalidates the user's refresh token to log them out.

- **URL**: `/logout`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:

  ```json
  {
    "userId": "number"
  }
  ```

  - `userId`: The ID of the user to log out (required).

- **Response**:
  - **Success (200)**:

    ```json
    {
      "message": "Logged out successfully"
    }
    ```

  - **Error (500)**:

    ```json
    {
      "message": "Server error during logout"
    }
    ```
- **Notes**:
  - Removes the refresh token associated with the `userId` from the server.
  - If no refresh token exists for the `userId`, the endpoint still returns a success response.
  - Typically called when the user explicitly logs out.

### 7. Request Password Reset (Request OTP)

Initiates the password reset process by sending an OTP to the user's phone.

- **URL**: `/reset-password/request`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:

  ```json
  {
    "phone": "string"
  }
  ```

  - `phone`: User's phone number (required).

- **Response**:
  - **Success (200)**:

    ```json
    {
      "message": "OTP sent to phone"
    }
    ```

  - **Error (400)**:

    ```json
    {
      "message": "Phone number is required"
    }
    ```

  - **Error (404)**:

    ```json
    {
      "message": "User not found"
    }
    ```

  - **Error (500)**:

    ```json
    {
      "message": "Failed to send OTP"
    }
    ```

    ```json
    {
      "message": "Server error during password reset request"
    }
    ```
- **Notes**:
  - The phone number must be associated with a registered user.
  - The OTP is 6 digits and valid for 5 minutes.

### 8. Verify OTP and Reset Password

Verifies the OTP and updates the user's password.

- **URL**: `/reset-password/verify`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Request Body**:

  ```json
  {
    "otp": "string",
    "phone": "string",
    "newPassword": "string"
  }
  ```

  - `otp`: 6-digit OTP received via SMS (required).
  - `phone`: User's phone number (required).
  - `newPassword`: New password (required, min 6 characters).

- **Response**:
  - **Success (200)**:

    ```json
    {
      "message": "Password reset successfully"
    }
    ```

  - **Error (400)**:

    ```json
    {
      "message": "OTP, phone and new password are required"
    }
    ```

    ```json
    {
      "message": "Password must be at least 6 characters"
    }
    ```

    ```json
    {
      "message": "Invalid OTP"
    }
    ```

    ```json
    {
      "message": "OTP expired"
    }
    ```

    ```json
    {
      "message": "OTP not found"
    }
    ```

    ```json
    {
      "message": "Too many failed attempts. Please request a new OTP."
    }
    ```

  - **Error (404)**:

    ```json
    {
      "message": "User not found"
    }
    ```

  - **Error (500)**:

    ```json
    {
      "message": "Server error during password reset verification"
    }
    ```
- **Notes**:
  - The OTP must match the one sent to the phone, not be expired, and have fewer than 5 failed attempts.
  - The OTP is removed from the server after a successful password reset.
  - All refresh tokens for the user are invalidated upon successful password reset.
  - The user must log in with the new password after reset.

## Error Handling

- **400 Bad Request**: Invalid or missing request parameters, or validation errors (e.g., invalid OTP, user already exists, password too short).
- **401 Unauthorized**: Missing or invalid refresh token.
- **403 Forbidden**: Invalid or unrecognized refresh token.
- **404 Not Found**: User not found for the provided phone number.
- **429 Too Many Requests**: OTP resend requested too soon (within 1 minute).
- **500 Internal Server Error**: Server-side issues, such as failure to send OTP via Twilio or database errors.

## Security Considerations

- **Secure Storage**: Store `accessToken` and `refreshToken` securely (e.g., `refreshToken` in HTTP-only cookies).
- **HTTPS**: Ensure all API requests are made over HTTPS to protect sensitive data.
- **Input Validation**:
  - Validate phone numbers (international format, e.g., `+1234567890`).
  - Ensure passwords are at least 6 characters.
  - Validate email format if provided.
- **Rate Limiting**:
  - OTP resends are limited to once per minute.
  - OTP verification allows up to 5 attempts before requiring a new OTP.
  - In production, implement proper rate limiting middleware for all endpoints.
- **Token Expiry**:
  - Access tokens expire after 1 hour.
  - Refresh tokens expire after 7 days.
  - OTPs expire after 5 minutes.
- **OTP Security**:
  - OTPs are numeric (6 digits) to ensure compatibility with SMS.
  - Failed OTP attempts are tracked, with a lockout after 5 attempts.
  - Expired OTPs are automatically removed from the store.

## Example Workflow (Signup)

1.  **Request OTP**:
    - POST `/signup` with `name`, `email` (optional), `phone`, and `password`.
    - Receive OTP via SMS.
2.  **Resend OTP (if needed)**:
    - POST `/resend-otp` with `phone` if OTP is not received or expired (wait 1 minute between requests).
3.  **Verify OTP**:
    - POST `/verify-otp` with `otp`, `phone`, `name`, `email`, and `password`.
    - Receive `accessToken`, `refreshToken`, and user details.
4.  **Use Token**:
    - Include `Bearer <accessToken>` in the `Authorization` header for authenticated requests.

## Example Workflow (Login)

1.  **Login**:
    - POST `/login` with `phone` and `password`.
    - Receive `accessToken`, `refreshToken`, and user details.
2.  **Refresh Token (if access token expires)**:
    - POST `/refresh-token` with `refreshToken`.
    - Receive new `accessToken`.
3.  **Logout**:
    - POST `/logout` with `userId`.
    - Refresh token is invalidated.

## Example Workflow (Password Reset)

1.  **Request OTP**:
    - POST `/reset-password/request` with `phone`.
    - Receive OTP via SMS.
2.  **Verify OTP and Reset**:
    - POST `/reset-password/verify` with `otp`, `phone`, and `newPassword`.
    - Password is updated, refresh tokens are invalidated, and user can log in with the new password.

## Frontend Integration Tips

- **Form Validation**:
  - Validate phone numbers (international format, e.g., `+1234567890`).
  - Ensure passwords are at least 6 characters.
  - Validate email format if provided.
  - Sanitize inputs to prevent injection attacks.
- **Error Messages**:
  - Display API error messages to users (e.g., "Invalid OTP", "Too many failed attempts").
  - For 429 errors, show `retryAfter` seconds in a countdown timer.
  - Handle OTP expiry or too many attempts by prompting the user to resend OTP.
- **Token Management**:
  - Store `accessToken` in memory or local storage (short-lived).
  - Store `refreshToken` in HTTP-only cookies for security.
  - Automatically refresh the access token before it expires using `/refresh-token`.
  - Clear tokens and redirect to login page after calling `/logout`.
- **UI/UX**:
  - Show a loading state while waiting for OTP or API responses.
  - Provide a "Resend OTP" button with a 60-second countdown timer based on rate limiting.
  - After successful signup or password reset, redirect to the login page or dashboard.
  - Display OTP attempt limits (e.g., "3 attempts remaining") to guide users.
- **Rate Limiting**:
  - Disable the "Resend OTP" button until `retryAfter` seconds have passed.
  - Warn users about the 5-attempt limit for OTP verification.

## Dependencies

The backend uses the following libraries:

- `express`: Web framework for Node.js.
- `bcryptjs`: Password hashing.
- `jsonwebtoken`: JWT generation and verification.
- `twilio`: SMS OTP delivery.
- `sequelize`: MySQL ORM for database operations.
- `otp-generator`: OTP generation.

## Environment Variables

Ensure the following environment variables are configured on the backend:

- `TWILIO_ACCOUNT_SID`: Twilio account SID.
- `TWILIO_AUTH_TOKEN`: Twilio auth token.
- `TWILIO_PHONE_NUMBER`: Twilio phone number for sending SMS.
- `JWT_SECRET`: Secret key for signing access tokens.
- `JWT_REFRESH_SECRET`: Secret key for signing refresh tokens.

## Contact

For issues or questions, contact the backend team at `support@mindbloom.com`.
