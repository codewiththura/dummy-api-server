import test from "node:test";
import assert from "node:assert/strict";
import { generateToken, verifyToken, extractToken } from "../utils/token.js";

test("Token Utility: generateToken and verifyToken", async (t) => {
  await t.test("generates standard 3-part JWT token", () => {
    const token = generateToken({ userId: 1, email: "thura@example.com" });
    assert.equal(typeof token, "string");
    const parts = token.split(".");
    assert.equal(parts.length, 3);
  });

  await t.test("verifies valid token and decodes payload claims", () => {
    const payload = { userId: 42, role: "developer", email: "test@example.com" };
    const token = generateToken(payload);
    const decoded = verifyToken(token);

    assert.ok(decoded);
    assert.equal(decoded.userId, 42);
    assert.equal(decoded.role, "developer");
    assert.equal(decoded.email, "test@example.com");
    assert.ok(decoded.iat, "iat timestamp should exist");
    assert.ok(decoded.exp, "exp timestamp should exist");
    assert.ok(decoded.exp > decoded.iat, "exp must be after iat");
  });

  await t.test("rejects token with invalid signature / tampered payload", () => {
    const token = generateToken({ userId: 1 });
    const [h, p, s] = token.split(".");

    // Tamper payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ userId: 999, exp: Math.floor(Date.now() / 1000) + 3600 }),
    ).toString("base64url");
    const tamperedToken = `${h}.${tamperedPayload}.${s}`;

    const decoded = verifyToken(tamperedToken);
    assert.equal(decoded, null);
  });

  await t.test("rejects token signed with different secret", () => {
    const token = generateToken({ userId: 1 }, { secret: "secret-a" });
    const decoded = verifyToken(token, { secret: "secret-b" });
    assert.equal(decoded, null);
  });

  await t.test("rejects expired token", () => {
    // expiresInSeconds negative -> expired immediately
    const token = generateToken({ userId: 1 }, { expiresInSeconds: -10 });
    const decoded = verifyToken(token);
    assert.equal(decoded, null);
  });

  await t.test("handles malformed or empty token strings gracefully", () => {
    assert.equal(verifyToken(""), null);
    assert.equal(verifyToken(null), null);
    assert.equal(verifyToken("not-a-token"), null);
    assert.equal(verifyToken("a.b"), null);
    assert.equal(verifyToken("a.b.c.d"), null);
  });
});

test("Token Utility: extractToken from request", async (t) => {
  await t.test("extracts token from standard Bearer authorization header", () => {
    const sampleToken = generateToken({ userId: 1 });
    const req = {
      headers: {
        authorization: `Bearer ${sampleToken}`,
      },
    };
    const extracted = extractToken(req);
    assert.equal(extracted, sampleToken);
  });

  await t.test("cleans surrounding quotes from token in authorization header", () => {
    const sampleToken = generateToken({ userId: 1 });
    const req = {
      headers: {
        authorization: `Bearer "${sampleToken}"`,
      },
    };
    const extracted = extractToken(req);
    assert.equal(extracted, sampleToken);
  });

  await t.test("extracts token from x-access-token header", () => {
    const sampleToken = generateToken({ userId: 2 });
    const req = {
      headers: {
        "x-access-token": sampleToken,
      },
    };
    const extracted = extractToken(req);
    assert.equal(extracted, sampleToken);
  });

  await t.test("extracts token from req.query.token", () => {
    const sampleToken = generateToken({ userId: 3 });
    const req = {
      headers: {},
      query: { token: sampleToken },
    };
    const extracted = extractToken(req);
    assert.equal(extracted, sampleToken);
  });

  await t.test("returns null when no token is present", () => {
    assert.equal(extractToken({ headers: {} }), null);
    assert.equal(extractToken(null), null);
  });
});
