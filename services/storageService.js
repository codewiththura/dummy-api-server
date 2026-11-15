import path from "path";
import { put, del, head } from "@vercel/blob";

/**
 * Sanitizes a path string to prevent path traversal and ensure safe storage naming.
 *
 * @param {string} pathname
 * @returns {string}
 */
export function sanitizeStoragePath(pathname) {
  if (!pathname || typeof pathname !== "string") {
    return `upload-${Date.now()}`;
  }
  const normalized = path.posix.normalize(pathname);
  return normalized
    .replace(/^(\.\.(\/|$))+/, "")
    .replace(/^\/+/, "")
    .replace(/[^a-zA-Z0-9_\-\/.]/g, "-");
}

/**
 * Checks whether a given URL is a Vercel Blob Storage URL (real or simulated).
 *
 * @param {string} url
 * @returns {boolean}
 */
export function isVercelBlobUrl(url) {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes(".blob.vercel-storage.com") ||
    url.includes("blob.vercel-storage.com")
  );
}

/**
 * Factory creating a StorageService instance.
 *
 * @param {object} [config={}]
 * @param {string} [config.token] - Optional Vercel Blob read/write token.
 * @param {boolean} [config.forceMock] - Force mock mode for deterministic testing.
 * @returns {object} Storage service instance.
 */
export function createStorageService(config = {}) {
  const getToken = () => config.token || process.env.BLOB_READ_WRITE_TOKEN;
  const forceMock = Boolean(config.forceMock);

  // In-memory registry for mock mode (used during offline dev & unit tests)
  const mockStorageMap = new Map();

  const isConfigured = () => Boolean(getToken()) && !forceMock;

  const getStorageProviderName = () => {
    return isConfigured() ? "vercel-blob" : "mock-vercel-blob";
  };

  /**
   * Uploads a file buffer or stream to Vercel Blob Storage.
   *
   * @param {string} pathname - Target path (e.g., "users/user-1.jpg")
   * @param {Buffer|Uint8Array|string} data - File buffer or content
   * @param {object} [options={}]
   * @param {string} [options.contentType] - MIME type of the file
   * @param {boolean} [options.addRandomSuffix=true] - Whether to append random suffix
   * @returns {Promise<{ url: string, pathname: string, contentType: string, size: number, provider: string }>}
   */
  const uploadBlob = async (pathname, data, options = {}) => {
    const safePath = sanitizeStoragePath(pathname);
    const contentType = options.contentType || "application/octet-stream";
    const addRandomSuffix = options.addRandomSuffix ?? true;
    const size = Buffer.isBuffer(data) ? data.length : (data?.length || 0);

    if (isConfigured()) {
      const activeToken = getToken();
      const blob = await put(safePath, data, {
        access: "public",
        contentType,
        addRandomSuffix,
        token: activeToken,
      });

      return {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        contentDisposition: blob.contentDisposition,
        downloadUrl: blob.downloadUrl,
        size,
        provider: "vercel-blob",
      };
    }

    // Fallback: In-memory simulation when BLOB_READ_WRITE_TOKEN is not configured
    const ext = path.extname(safePath) || "";
    const baseWithoutExt = safePath.slice(0, safePath.length - ext.length);
    const suffix = addRandomSuffix
      ? `-${Math.random().toString(36).substring(2, 10)}`
      : "";
    const simulatedPath = `${baseWithoutExt}${suffix}${ext}`;
    const mockUrl = `https://mock-store.public.blob.vercel-storage.com/${simulatedPath}`;

    mockStorageMap.set(mockUrl, {
      url: mockUrl,
      pathname: simulatedPath,
      contentType,
      size,
      data,
      createdAt: new Date().toISOString(),
    });

    return {
      url: mockUrl,
      pathname: simulatedPath,
      contentType,
      downloadUrl: mockUrl,
      size,
      provider: "mock-vercel-blob",
    };
  };

  /**
   * Deletes a blob from Vercel Blob Storage by URL.
   *
   * @param {string} url - The blob URL to delete
   * @returns {Promise<boolean>} True if deleted or ignored safely
   */
  const deleteBlob = async (url) => {
    if (!url || typeof url !== "string") return false;

    // Do not attempt to delete non-Vercel URLs (e.g. external seed avatars/photos)
    if (!isVercelBlobUrl(url)) {
      return false;
    }

    if (isConfigured()) {
      try {
        await del(url, { token: getToken() });
        return true;
      } catch (err) {
        console.error(`[StorageService] Failed to delete blob ${url}:`, err.message);
        return false;
      }
    }

    // Fallback: remove from mock store
    if (mockStorageMap.has(url)) {
      mockStorageMap.delete(url);
      return true;
    }

    return true;
  };

  /**
   * Retrieves metadata of a blob.
   *
   * @param {string} url - Blob URL
   * @returns {Promise<object|null>}
   */
  const getBlobMetadata = async (url) => {
    if (!url || !isVercelBlobUrl(url)) return null;

    if (isConfigured()) {
      try {
        return await head(url, { token: getToken() });
      } catch {
        return null;
      }
    }

    return mockStorageMap.get(url) || null;
  };

  const clearMockStore = () => {
    mockStorageMap.clear();
  };

  return {
    uploadBlob,
    deleteBlob,
    getBlobMetadata,
    isVercelBlobUrl,
    isConfigured,
    getStorageProviderName,
    clearMockStore,
  };
}

// Default shared instance
export const defaultStorageService = createStorageService();
export default defaultStorageService;
