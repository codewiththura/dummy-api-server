import express from "express";
import path from "path";
import {
  handleImageUpload,
  ALLOWED_IMAGE_MIMES,
  MAX_FILE_SIZE_BYTES,
} from "../middleware/upload.js";
import defaultStorageService from "../services/storageService.js";

/**
 * Factory creating Express router for Vercel Storage photo uploads.
 *
 * @param {object} options
 * @param {Array<object>} options.users - In-memory users collection.
 * @param {Array<object>} options.posts - In-memory posts collection.
 * @param {object} [options.storageService] - Storage service instance.
 * @param {Function} options.sanitizeUser - Function to sanitize user objects.
 * @param {Function} options.formatPost - Function to format post objects.
 * @param {Function} options.getActiveUserId - Function to determine active user ID.
 * @returns {import("express").Router}
 */
export function createUploadRouter({
  users,
  posts,
  storageService = defaultStorageService,
  sanitizeUser,
  formatPost,
  getActiveUserId,
}) {
  const router = express.Router();

  // Validation middleware: Ensure target user exists before processing upload
  const validateUserForUpload = (req, res, next) => {
    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    const user = users.find((u) => u.id === userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    req.targetUser = user;
    next();
  };

  // Validation middleware: Ensure target post exists before processing upload
  const validatePostForUpload = (req, res, next) => {
    const postId = Number(req.params.id);
    if (isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }
    const post = posts.find((p) => p.id === postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    req.targetPost = post;
    next();
  };

  // Handler: User avatar photo upload to Vercel Storage
  const userPhotoUploadHandler = async (req, res) => {
    try {
      const user = req.targetUser;
      const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
      const targetPath = `users/user-${user.id}${ext}`;

      // Upload buffer directly to Vercel Blob (zero disk footprint)
      const blobResult = await storageService.uploadBlob(
        targetPath,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          addRandomSuffix: true,
        },
      );

      // Clean up previous blob on Vercel storage if it exists
      const previousAvatarUrl = user.avatarUrl;
      if (storageService.isVercelBlobUrl(previousAvatarUrl)) {
        await storageService.deleteBlob(previousAvatarUrl);
      }

      user.avatarUrl = blobResult.url;
      user.updatedAt = new Date().toISOString();

      return res.status(200).json({
        message: "User profile photo uploaded successfully to Vercel storage",
        avatarUrl: blobResult.url,
        fullUrl: blobResult.url,
        pathname: blobResult.pathname,
        size: req.file.size,
        storage: blobResult.provider,
        user: sanitizeUser(user),
      });
    } catch (err) {
      console.error("[Upload] User avatar upload failed:", err);
      return res.status(500).json({
        error: "Failed to upload user avatar to Vercel storage",
        details: err.message,
      });
    }
  };

  // Handler: Post image photo upload to Vercel Storage
  const postPhotoUploadHandler = async (req, res) => {
    try {
      const post = req.targetPost;
      const ext = path.extname(req.file.originalname).toLowerCase() || ".jpg";
      const targetPath = `posts/post-${post.id}${ext}`;

      // Upload buffer directly to Vercel Blob (zero disk footprint)
      const blobResult = await storageService.uploadBlob(
        targetPath,
        req.file.buffer,
        {
          contentType: req.file.mimetype,
          addRandomSuffix: true,
        },
      );

      // Clean up previous blob on Vercel storage if it exists
      const previousImageUrl = post.imageUrl;
      if (storageService.isVercelBlobUrl(previousImageUrl)) {
        await storageService.deleteBlob(previousImageUrl);
      }

      post.imageUrl = blobResult.url;
      post.updatedAt = new Date().toISOString();

      const activeUserId = getActiveUserId ? getActiveUserId(req) : null;

      return res.status(200).json({
        message: "Post photo uploaded successfully to Vercel storage",
        imageUrl: blobResult.url,
        fullUrl: blobResult.url,
        pathname: blobResult.pathname,
        size: req.file.size,
        storage: blobResult.provider,
        post: formatPost(post, activeUserId),
      });
    } catch (err) {
      console.error("[Upload] Post photo upload failed:", err);
      return res.status(500).json({
        error: "Failed to upload post photo to Vercel storage",
        details: err.message,
      });
    }
  };

  // Handler: Delete user profile photo
  const userPhotoDeleteHandler = async (req, res) => {
    const user = req.targetUser;
    const previousAvatarUrl = user.avatarUrl;

    if (storageService.isVercelBlobUrl(previousAvatarUrl)) {
      await storageService.deleteBlob(previousAvatarUrl);
    }

    user.avatarUrl = `https://i.pravatar.cc/150?u=${user.username || user.id}`;
    user.updatedAt = new Date().toISOString();

    return res.status(200).json({
      message: "User profile photo removed successfully from Vercel storage",
      avatarUrl: user.avatarUrl,
      user: sanitizeUser(user),
    });
  };

  // Handler: Delete post photo
  const postPhotoDeleteHandler = async (req, res) => {
    const post = req.targetPost;
    const previousImageUrl = post.imageUrl;

    if (storageService.isVercelBlobUrl(previousImageUrl)) {
      await storageService.deleteBlob(previousImageUrl);
    }

    post.imageUrl = null;
    post.updatedAt = new Date().toISOString();

    const activeUserId = getActiveUserId ? getActiveUserId(req) : null;

    return res.status(200).json({
      message: "Post photo removed successfully from Vercel storage",
      imageUrl: post.imageUrl,
      post: formatPost(post, activeUserId),
    });
  };

  // Storage status / health check endpoint
  router.get("/storage/status", (req, res) => {
    return res.json({
      status: "ok",
      provider: storageService.getStorageProviderName(),
      configured: storageService.isConfigured(),
      serverDiskStorage: "disabled (zero disk footprint)",
      allowedMimes: ALLOWED_IMAGE_MIMES,
      maxFileSizeBytes: MAX_FILE_SIZE_BYTES,
    });
  });

  // User avatar photo upload endpoints (with aliases for backwards compatibility)
  router.post(
    "/users/:id/photo",
    validateUserForUpload,
    handleImageUpload,
    userPhotoUploadHandler,
  );
  router.post(
    "/users/:id/avatar",
    validateUserForUpload,
    handleImageUpload,
    userPhotoUploadHandler,
  );
  router.post(
    "/upload/user/:id",
    validateUserForUpload,
    handleImageUpload,
    userPhotoUploadHandler,
  );
  router.delete(
    "/users/:id/photo",
    validateUserForUpload,
    userPhotoDeleteHandler,
  );
  router.delete(
    "/users/:id/avatar",
    validateUserForUpload,
    userPhotoDeleteHandler,
  );

  // Post photo upload endpoints (with aliases for backwards compatibility)
  router.post(
    "/posts/:id/photo",
    validatePostForUpload,
    handleImageUpload,
    postPhotoUploadHandler,
  );
  router.post(
    "/posts/:id/image",
    validatePostForUpload,
    handleImageUpload,
    postPhotoUploadHandler,
  );
  router.post(
    "/upload/post/:id",
    validatePostForUpload,
    handleImageUpload,
    postPhotoUploadHandler,
  );
  router.delete(
    "/posts/:id/photo",
    validatePostForUpload,
    postPhotoDeleteHandler,
  );
  router.delete(
    "/posts/:id/image",
    validatePostForUpload,
    postPhotoDeleteHandler,
  );

  return router;
}

export default createUploadRouter;
