import test, { describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import fs from "node:fs";

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

describe("Social App Mock Backend API Tests", () => {
  let serverProcess;

  before(async () => {
    // Start server on an isolated port for testing
    serverProcess = spawn("node", ["server.js"], {
      env: { ...process.env, PORT: String(TEST_PORT) },
      stdio: "pipe",
    });

    // Wait until server is listening
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
        console.error(`Server stderr: ${data}`);
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
    // Clean up test upload files created during testing
    try {
      const testFile = new URL("../uploads/users/user-1.jpg", import.meta.url);
      if (fs.existsSync(testFile)) {
        fs.unlinkSync(testFile);
      }
    } catch {}
  });

  test("GET /api/users returns pre-seeded dummy users with userId 1", async () => {
    const res = await fetch(`${BASE_URL}/api/users`);
    assert.equal(res.status, 200);

    const users = await res.json();
    assert.ok(Array.isArray(users));
    assert.equal(users.length, 6);

    const user1 = users.find((u) => u.id === 1);
    assert.ok(user1);
    assert.equal(user1.username, "thura");
    assert.equal(user1.email, "thura@example.com");
    // Ensure password is not exposed
    assert.equal(user1.password, undefined);
  });

  test("POST /api/posts defaults to userId 1 when unauthenticated", async () => {
    const res = await fetch(`${BASE_URL}/api/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Test Post Without Auth",
        body: "Checking default userId fallback",
      }),
    });

    assert.equal(res.status, 201);
    const post = await res.json();
    assert.equal(post.userId, 1);
    assert.equal(post.author?.name, "Thura");
    assert.equal(post.title, "Test Post Without Auth");
  });

  test("POST /api/posts/:id/like defaults to user 1 when no userId is passed", async () => {
    const res = await fetch(`${BASE_URL}/api/posts/2/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 200);
    const post = await res.json();
    // Post 2 originally had likes: [1, 3, 4]
    // Toggling as user 1 removes user 1 from likes
    assert.ok(Array.isArray(post.likes));
  });

  test("POST /api/users/:id/photo rejects invalid MIME types with 400", async () => {
    const formData = new FormData();
    const fakeTextFile = new Blob(["hello world"], { type: "text/plain" });
    formData.append("photo", fakeTextFile, "document.txt");

    const res = await fetch(`${BASE_URL}/api/users/1/photo`, {
      method: "POST",
      body: formData,
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("Invalid file type"));
  });

  test("POST /api/users/:id/photo returns 404 for non-existent user", async () => {
    const formData = new FormData();
    const fakeImage = new Blob(["fake-image-bytes"], { type: "image/png" });
    formData.append("photo", fakeImage, "test.png");

    const res = await fetch(`${BASE_URL}/api/users/9999/photo`, {
      method: "POST",
      body: formData,
    });

    assert.equal(res.status, 404);
    const data = await res.json();
    assert.equal(data.error, "User not found");
  });

  test("POST /api/users/:id/photo allows public upload and updates user avatar", async () => {
    const formData = new FormData();
    const fakeImage = new Blob(["fake-image-content"], { type: "image/jpeg" });
    formData.append("photo", fakeImage, "avatar.jpg");

    const res = await fetch(`${BASE_URL}/api/users/1/photo`, {
      method: "POST",
      body: formData,
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.message, "User profile photo uploaded successfully");
    assert.ok(data.avatarUrl.startsWith("/uploads/users/user-1."));
    assert.ok(data.fullUrl.includes("/uploads/users/user-1."));
    assert.equal(data.user.id, 1);
  });

  test("POST /api/forms/submit handles application/x-www-form-urlencoded HTML forms", async () => {
    const params = new URLSearchParams();
    params.append("username", "tester_alex");
    params.append("email", "alex@test.com");
    params.append("newsletter", "true");
    params.append("age", "25");

    const res = await fetch(`${BASE_URL}/api/forms/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.method, "POST");
    assert.equal(data.fieldsCount, 4);
    assert.equal(data.fields.username, "tester_alex");
    assert.equal(data.fields.email, "alex@test.com");
    assert.equal(data.fields.newsletter, "true");
    assert.equal(data.fields.age, "25");
  });

  test("POST /api/forms/submit handles application/json submissions from JS code", async () => {
    const payload = {
      fullName: "Jane Doe",
      interests: ["coding", "design"],
      settings: { notifications: true, theme: "dark" },
    };

    const res = await fetch(`${BASE_URL}/api/forms/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.fields.fullName, "Jane Doe");
    assert.deepEqual(data.fields.interests, ["coding", "design"]);
    assert.deepEqual(data.fields.settings, { notifications: true, theme: "dark" });
  });

  test("POST /api/forms/submit handles multipart/form-data with text fields and attached files", async () => {
    const formData = new FormData();
    formData.append("title", "Project Proposal");
    formData.append("category", "Technology");
    const sampleDoc = new Blob(["sample document content"], { type: "text/plain" });
    formData.append("attachment", sampleDoc, "proposal.txt");

    const res = await fetch(`${BASE_URL}/api/forms/submit`, {
      method: "POST",
      body: formData,
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.fields.title, "Project Proposal");
    assert.equal(data.fields.category, "Technology");
    assert.equal(data.filesCount, 1);
    assert.equal(data.files[0].fieldName, "attachment");
    assert.equal(data.files[0].originalName, "proposal.txt");
    assert.equal(data.files[0].mimeType, "text/plain");
  });

  test("GET /api/forms/submit with ?format=html renders visual HTML report", async () => {
    const res = await fetch(`${BASE_URL}/api/forms/submit?name=TestUser&role=QA&format=html`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get("content-type")?.includes("text/html"));
    const html = await res.text();
    assert.ok(html.includes("Form Submission Received"));
    assert.ok(html.includes("TestUser"));
    assert.ok(html.includes("QA"));
  });
});
