import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { verifyToken } from "../utils/token.js";

const TEST_PORT = 5098;
const BASE_URL = `http://localhost:${TEST_PORT}`;

describe("Authentication & Token Alignment Tests", () => {
  let serverProcess;

  before(async () => {
    // Start server on an isolated port for testing
    serverProcess = spawn("node", ["server.js"], {
      env: { ...process.env, PORT: String(TEST_PORT) },
      stdio: "pipe",
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Server failed to start within timeout"));
      }, 5000);

      serverProcess.stdout.on("data", (data) => {
        if (data.toString().includes(`http://localhost:${TEST_PORT}`)) {
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr.on("data", (data) => {
        console.error(`Auth test server stderr: ${data}`);
      });

      serverProcess.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  after(() => {
    if (serverProcess) {
      serverProcess.kill("SIGTERM");
    }
  });

  test("POST /api/auth/login returns { user, token } aligned with social app demo", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "thura@example.com",
        password: "password123",
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();

    // Verify top-level structure: { user, token }
    assert.ok(data.user, "Response must include 'user' object");
    assert.ok(data.token, "Response must include 'token' string");
    assert.equal(typeof data.token, "string");

    // Verify user fields match social app demo conventions
    assert.equal(data.user.id, 1);
    assert.equal(data.user._id, 1, "User must include _id for frontend compatibility");
    assert.equal(data.user.name, "Thura");
    assert.equal(data.user.username, "thura");
    assert.equal(data.user.email, "thura@example.com");
    assert.equal(data.user.password, undefined, "Password must not be exposed");

    // Verify token validity
    const decoded = verifyToken(data.token);
    assert.ok(decoded, "Token must be valid JWT");
    assert.equal(decoded.userId, 1);
    assert.equal(decoded.email, "thura@example.com");
  });

  test("POST /auth/login (alias without /api) also returns { user, token }", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "maythin@example.com",
        password: "password123",
      }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();

    assert.ok(data.user);
    assert.ok(data.token);
    assert.equal(data.user.id, 2);
    assert.equal(data.user.username, "maythin");
    assert.equal(data.user.password, undefined);
  });

  test("POST /api/auth/login rejects invalid credentials with 401", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "thura@example.com",
        password: "wrong-password",
      }),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.ok(data.error || data.message);
  });

  test("POST /api/auth/login rejects empty credentials with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 400);
  });

  test("GET /api/auth/me resolves user using Authorization: Bearer <token>", async () => {
    // 1. Log in to get token for user 2
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "maythin@example.com",
        password: "password123",
      }),
    });
    const { token } = await loginRes.json();

    // 2. Query /api/auth/me with Bearer token
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    assert.equal(meRes.status, 200);
    const meUser = await meRes.json();
    assert.equal(meUser.id, 2);
    assert.equal(meUser.name, "May Thin");
    assert.equal(meUser.email, "maythin@example.com");
  });

  test("POST /api/auth/register creates user and returns { user, token }", async () => {
    const uniqueEmail = `testuser_${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Developer",
        username: `dev_${Date.now()}`,
        email: uniqueEmail,
        password: "securepassword123",
        bio: "Testing registration endpoint",
      }),
    });

    assert.equal(res.status, 201);
    const data = await res.json();
    assert.ok(data.user);
    assert.ok(data.token);
    assert.equal(data.user.email, uniqueEmail);
    assert.equal(data.user.name, "Test Developer");
    assert.equal(data.user.password, undefined);
  });

  test("POST /api/auth/logout clears active session", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: "POST",
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
  });
});
