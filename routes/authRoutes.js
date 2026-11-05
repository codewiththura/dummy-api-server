import express from "express";
import { generateToken } from "../utils/token.js";

/**
 * Factory creating Express router for auth routes.
 *
 * @param {object} options
 * @param {Array<object>} options.users - In-memory users collection.
 * @param {Function} options.sanitizeUser - Function to sanitize user object.
 * @param {Function} options.setCurrentUserId - Callback to update current user ID.
 * @param {Function} options.getCurrentUserId - Callback to get current user ID.
 * @returns {import("express").Router}
 */
export function createAuthRouter({
  users,
  sanitizeUser,
  setCurrentUserId,
  getCurrentUserId,
}) {
  const router = express.Router();

  // POST /login (or /api/auth/login)
  router.post("/login", (req, res) => {
    const { email, password } = req.body || {};
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        error: "Email and password are required",
        message: "Email and password are required",
      });
    }

    const user = users.find(
      (u) =>
        u.email.toLowerCase() === normalizedEmail && u.password === password,
    );

    if (!user) {
      return res.status(401).json({
        error: "Invalid email or password",
        message: "Invalid email or password",
      });
    }

    if (typeof setCurrentUserId === "function") {
      setCurrentUserId(user.id);
    }

    const token = generateToken({
      userId: user.id,
      id: user.id,
      email: user.email,
      username: user.username,
    });

    const safeUser = sanitizeUser(user);

    // Aligns with social app demo response format: { user, token }
    return res.status(200).json({
      user: safeUser,
      token,
    });
  });

  // POST /register (or /api/auth/register)
  router.post("/register", (req, res) => {
    const { name, email, password, username, bio, avatarUrl } = req.body || {};
    const normalizedEmail = (email || "").trim().toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({
        error: "Email and password are required",
        message: "Email and password are required",
      });
    }

    const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return res.status(400).json({
        error: "Email already registered",
        message: "Email already registered",
      });
    }

    const rawUsername = (username || name || "user")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
    const now = new Date().toISOString();

    const newUser = {
      id: Date.now(),
      name: name || "New User",
      username: rawUsername,
      email: normalizedEmail,
      password,
      avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${rawUsername}`,
      bio: bio || "Hello, I am using Social App!",
      createdAt: now,
      updatedAt: now,
    };

    users.push(newUser);

    if (typeof setCurrentUserId === "function") {
      setCurrentUserId(newUser.id);
    }

    const token = generateToken({
      userId: newUser.id,
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    });

    const safeUser = sanitizeUser(newUser);

    return res.status(201).json({
      user: safeUser,
      token,
    });
  });

  // GET /me (or /api/auth/me)
  router.get("/me", (req, res) => {
    let authUser = req.user;

    if (!authUser && typeof getCurrentUserId === "function") {
      const activeId = getCurrentUserId();
      if (activeId) {
        authUser = users.find((u) => u.id === Number(activeId));
      }
    }

    if (!authUser) {
      return res.status(401).json({
        error: "Not authenticated",
        message: "Authentication required",
      });
    }

    return res.json(sanitizeUser(authUser));
  });

  // POST /logout (or /api/auth/logout)
  router.post("/logout", (req, res) => {
    if (typeof setCurrentUserId === "function") {
      setCurrentUserId(null);
    }
    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  });

  return router;
}

export default createAuthRouter;
