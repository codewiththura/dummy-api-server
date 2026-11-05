import { extractToken, verifyToken } from "../utils/token.js";

/**
 * Middleware factory for resolving the current user from Bearer JWT token,
 * optional fallback user ID, and attaching req.user and req.userId.
 *
 * @param {Array<object>} users - Reference to the users collection.
 * @param {Function} [getFallbackUserId] - Function returning current global active user ID fallback.
 * @returns {import("express").RequestHandler}
 */
export function createUserAuthMiddleware(users, getFallbackUserId) {
  return (req, res, next) => {
    req.user = null;
    req.userId = null;

    const token = extractToken(req);
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && (decoded.userId || decoded.id)) {
        const targetId = Number(decoded.userId || decoded.id);
        const matched = users.find((u) => u.id === targetId);
        if (matched) {
          req.user = matched;
          req.userId = matched.id;
        }
      }
    }

    // Fast testing fallback: If no token was provided, fall back to active session or default
    if (!req.user && typeof getFallbackUserId === "function") {
      const fallbackId = getFallbackUserId();
      if (fallbackId) {
        const fallbackUser = users.find((u) => u.id === Number(fallbackId));
        if (fallbackUser) {
          req.user = fallbackUser;
          req.userId = fallbackUser.id;
        }
      }
    }

    next();
  };
}

/**
 * Middleware requiring an authenticated user.
 */
export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: "Authentication required",
      message: "Authentication required",
    });
  }
  next();
}
