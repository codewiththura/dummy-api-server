import test, { describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadEnvFiles } from "../utils/env.js";

describe("Environment Loader Utility Tests", () => {
  test("loadEnvFiles loads .env.local and .env adhering to precedence rules", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "env-test-"));
    const envLocalFile = path.join(tempDir, ".env.local");
    const envFile = path.join(tempDir, ".env");

    fs.writeFileSync(
      envLocalFile,
      `
# Comment line
TEST_VAR_A=local_a
TEST_VAR_OVERRIDE=from_local
TEST_QUOTED="quoted_value"
`,
    );

    fs.writeFileSync(
      envFile,
      `
TEST_VAR_OVERRIDE=from_base
TEST_VAR_BASE_ONLY=base_value
`,
    );

    // Pre-set a variable to verify pre-existing process.env takes highest precedence
    process.env.TEST_PRESET = "system_value";

    const loadedFiles = loadEnvFiles(tempDir);
    assert.deepEqual(loadedFiles, [".env.local", ".env"]);

    assert.equal(process.env.TEST_VAR_A, "local_a");
    assert.equal(process.env.TEST_VAR_OVERRIDE, "from_local");
    assert.equal(process.env.TEST_QUOTED, "quoted_value");
    assert.equal(process.env.TEST_VAR_BASE_ONLY, "base_value");
    assert.equal(process.env.TEST_PRESET, "system_value");

    // Cleanup process.env and temp files
    delete process.env.TEST_VAR_A;
    delete process.env.TEST_VAR_OVERRIDE;
    delete process.env.TEST_QUOTED;
    delete process.env.TEST_VAR_BASE_ONLY;
    delete process.env.TEST_PRESET;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  test("loadEnvFiles handles non-existent files gracefully without throwing", () => {
    const emptyTempDir = fs.mkdtempSync(path.join(os.tmpdir(), "empty-env-"));
    const loaded = loadEnvFiles(emptyTempDir);
    assert.deepEqual(loaded, []);
    fs.rmSync(emptyTempDir, { recursive: true, force: true });
  });
});
