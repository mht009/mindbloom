// src/utils/userResolver.js
import axios from "axios";

// Cache to store resolved usernames
const userCache = new Map();

/**
 * Resolves a single user ID to a username
 * @param {string|number} userId - The user ID to resolve
 * @returns {Promise<object|null>} - User object or null if not found
 */
export const resolveUserId = async (userId) => {
  if (!userId) return null;

  // Check cache first
  if (userCache.has(userId.toString())) {
    return userCache.get(userId.toString());
  }

  try {
    const response = await axios.get(`/api/users/resolve?userIds=${userId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    if (
      response.data &&
      response.data.users &&
      response.data.users.length > 0
    ) {
      const user = response.data.users[0];

      // Store in cache
      userCache.set(userId.toString(), user);

      return user;
    }

    return null;
  } catch (error) {
    console.error("Error resolving user ID:", error);
    return null;
  }
};

/**
 * Batch resolves multiple user IDs to usernames
 * @param {Array<string|number>} userIds - Array of user IDs to resolve
 * @returns {Promise<Object>} - Map of user IDs to user objects
 */
export const resolveUserIds = async (userIds) => {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return {};
  }

  // Filter out empty values and convert to strings
  const validUserIds = userIds.filter((id) => id).map((id) => id.toString());

  if (validUserIds.length === 0) {
    return {};
  }

  // Check which IDs we need to fetch (not in cache)
  const idsToFetch = validUserIds.filter((id) => !userCache.has(id));

  // If all IDs are in cache, return cached results
  if (idsToFetch.length === 0) {
    const result = {};
    validUserIds.forEach((id) => {
      result[id] = userCache.get(id);
    });
    return result;
  }

  try {
    // Fetch users that are not in cache
    const response = await axios.get(
      `/api/users/resolve?userIds=${idsToFetch.join(",")}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      }
    );

    const result = {};

    // Process fetched users
    if (response.data && response.data.users) {
      response.data.users.forEach((user) => {
        // Add to result
        result[user.userId] = user;

        // Update cache
        userCache.set(user.userId.toString(), user);
      });
    }

    // Add cached users to result
    validUserIds.forEach((id) => {
      if (userCache.has(id) && !result[id]) {
        result[id] = userCache.get(id);
      }
    });

    return result;
  } catch (error) {
    console.error("Error resolving user IDs:", error);

    // Return any cached IDs we have
    const result = {};
    validUserIds.forEach((id) => {
      if (userCache.has(id)) {
        result[id] = userCache.get(id);
      }
    });

    return result;
  }
};

/**
 * Resolves user information for content items like stories and comments
 * @param {Array} items - Array of content items with userId property
 * @returns {Promise<Array>} - Same items with user property added
 */
export const resolveUsersForItems = async (items) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return items;
  }

  // Extract all user IDs
  const userIds = items.map((item) => item.userId).filter((id) => id);

  if (userIds.length === 0) {
    return items;
  }

  // Resolve all user IDs
  const userMap = await resolveUserIds(userIds);

  // Add user info to each item
  return items.map((item) => {
    if (item.userId && userMap[item.userId]) {
      return {
        ...item,
        user: userMap[item.userId],
      };
    }
    return item;
  });
};

export default {
  resolveUserId,
  resolveUserIds,
  resolveUsersForItems,
};
