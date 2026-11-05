import crypto from "node:crypto";

const DEFAULT_SECRET =
  process.env.JWT_SECRET || "social-app-mock-jwt-secret-key-2026";
const DEFAULT_EXPIRATION_SECONDS = 7 * 24 * 60 * 60; // 7 days (aligns with express-social-server)

/**
 * Encode string or buffer to URL-safe Base64 without padding.
 * @param {string|Buffer} input
 * @returns {string}
 */
function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, "utf-8");
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Decode URL-safe Base64 string into UTF-8 string.
 * @param {string} input
 * @returns {string}
 */
function base64UrlDecode(input) {
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

/**
 * Generate a cryptographically signed HMAC-SHA256 JWT token.
 *
 * @param {object} payload - Claims to embed in the token.
 * @param {object} [options]
 * @param {string} [options.secret] - Secret key for signing (defaults to JWT_SECRET env or fallback).
 * @param {number} [options.expiresInSeconds] - Token TTL in seconds (default 7 days).
 * @returns {string} The signed JWT string in format header.payload.signature
 */
export function generateToken(payload, options = {}) {
  const secret = options.secret || DEFAULT_SECRET;
  const expiresInSeconds =
    typeof options.expiresInSeconds === "number"
      ? options.expiresInSeconds
      : DEFAULT_EXPIRATION_SECONDS;

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claims = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(claims));
  const dataToSign = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest();

  const encodedSignature = base64UrlEncode(signature);
  return `${dataToSign}.${encodedSignature}`;
}

/**
 * Verify an HMAC-SHA256 JWT token and return its decoded payload.
 *
 * Uses timing-safe comparisons to prevent timing side-channel attacks.
 *
 * @param {string} token - The JWT string to verify.
 * @param {object} [options]
 * @param {string} [options.secret] - Secret key to verify with.
 * @returns {object|null} The decoded claims payload, or null if invalid or expired.
 */
export function verifyToken(token, options = {}) {
  if (!token || typeof token !== "string") {
    return null;
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const secret = options.secret || DEFAULT_SECRET;

  try {
    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(dataToSign)
      .digest();
    const actualSignature = Buffer.from(
      encodedSignature.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    );

    if (expectedSignature.length !== actualSignature.length) {
      return null;
    }

    // Constant-time comparison to mitigate timing attacks
    if (!crypto.timingSafeEqual(expectedSignature, actualSignature)) {
      return null;
    }

    const payloadJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(payloadJson);

    // Check expiration if present
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp === "number" && payload.exp < now) {
      return null; // Token expired
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Extract a Bearer token from common request formats:
 * - Authorization: Bearer <token>
 * - x-access-token: <token>
 * - query parameter ?token=<token>
 *
 * @param {object} req - Express request object.
 * @returns {string|null} The extracted raw token or null if not present.
 */
export function extractToken(req) {
  if (!req) return null;

  const authHeader = req.headers?.authorization;
  if (authHeader && typeof authHeader === "string") {
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length === 2 && /^bearer$/i.test(parts[0])) {
      // Clean possible quotes added by frontend serialization (e.g. localStorage.getItem wrapping)
      return parts[1].replace(/^['"](.*)['"]$/, "$1");
    }
    // Also accept raw token in authorization if single word
    if (parts.length === 1 && parts[0].includes(".")) {
      return parts[0].replace(/^['"](.*)['"]$/, "$1");
    }
  }

  const altHeader = req.headers?.["x-access-token"];
  if (altHeader && typeof altHeader === "string") {
    return altHeader.trim().replace(/^['"](.*)['"]$/, "$1");
  }

  if (req.query?.token && typeof req.query.token === "string") {
    return req.query.token.trim().replace(/^['"](.*)['"]$/, "$1");
  }

  return null;
}
