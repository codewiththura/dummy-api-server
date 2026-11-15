import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  createStorageService,
  sanitizeStoragePath,
  isVercelBlobUrl,
} from "../services/storageService.js";
import { imageFileFilter, ALLOWED_IMAGE_MIMES } from "../middleware/upload.js";

describe("Storage Service & Utility Tests", () => {
  test("sanitizeStoragePath sanitizes leading slashes and dangerous traversal characters", () => {
    assert.equal(sanitizeStoragePath("/users/user-1.jpg"), "users/user-1.jpg");
    assert.equal(
      sanitizeStoragePath("../../secret/user-1.jpg"),
      "secret/user-1.jpg",
    );
    assert.equal(sanitizeStoragePath("user#1@photo.png"), "user-1-photo.png");
    assert.ok(sanitizeStoragePath("").startsWith("upload-"));
  });

  test("isVercelBlobUrl identifies Vercel Blob URLs and rejects others", () => {
    assert.equal(
      isVercelBlobUrl("https://abc.public.blob.vercel-storage.com/users/avatar.jpg"),
      true,
    );
    assert.equal(
      isVercelBlobUrl("https://mock-store.public.blob.vercel-storage.com/posts/test.jpg"),
      true,
    );
    assert.equal(isVercelBlobUrl("https://i.pravatar.cc/150?u=test"), false);
    assert.equal(isVercelBlobUrl("/uploads/users/user-1.jpg"), false);
    assert.equal(isVercelBlobUrl(null), false);
    assert.equal(isVercelBlobUrl(""), false);
  });

  test("StorageService mock mode uploads, inspects, and deletes blob properly", async () => {
    const storage = createStorageService({ forceMock: true });
    assert.equal(storage.getStorageProviderName(), "mock-vercel-blob");
    assert.equal(storage.isConfigured(), false);

    const buffer = Buffer.from("fake-image-bytes");
    const result = await storage.uploadBlob("users/user-42.jpg", buffer, {
      contentType: "image/jpeg",
      addRandomSuffix: true,
    });

    assert.ok(result.url.includes("blob.vercel-storage.com"));
    assert.ok(result.pathname.startsWith("users/user-42"));
    assert.equal(result.contentType, "image/jpeg");
    assert.equal(result.size, buffer.length);
    assert.equal(result.provider, "mock-vercel-blob");

    // Retrieve metadata
    const metadata = await storage.getBlobMetadata(result.url);
    assert.ok(metadata);
    assert.equal(metadata.size, buffer.length);

    // Delete blob
    const deleted = await storage.deleteBlob(result.url);
    assert.equal(deleted, true);

    // Deleting again or deleting non-Vercel url
    const externalDeleted = await storage.deleteBlob("https://unsplash.com/photo.jpg");
    assert.equal(externalDeleted, false);
  });

  test("StorageService reports vercel-blob provider when token is present", () => {
    const storageWithToken = createStorageService({
      token: "vercel_blob_rw_test_token_123",
    });
    assert.equal(storageWithToken.getStorageProviderName(), "vercel-blob");
    assert.equal(storageWithToken.isConfigured(), true);
  });

  test("Upload Middleware: imageFileFilter validates allowed MIME types", () => {
    ALLOWED_IMAGE_MIMES.forEach((mime) => {
      imageFileFilter({}, { mimetype: mime }, (err, allowed) => {
        assert.equal(err, null);
        assert.equal(allowed, true);
      });
    });

    // Test rejection of non-image MIME types
    const disallowed = ["text/plain", "application/pdf", "video/mp4", "application/json"];
    disallowed.forEach((mime) => {
      imageFileFilter({}, { mimetype: mime }, (err, allowed) => {
        assert.ok(err);
        assert.equal(err.code, "INVALID_IMAGE_TYPE");
        assert.equal(allowed, false);
      });
    });
  });
});
