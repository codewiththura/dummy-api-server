import fs from "fs";
import path from "path";

/**
 * Automatically loads environment variables from .env.local and .env files
 * into process.env if present, adhering to 12-factor and Vercel/Next.js precedence rules.
 *
 * Precedence:
 * 1. Existing process.env variables (CLI flags, system env)
 * 2. .env.local (local development overrides)
 * 3. .env (base environment configuration)
 *
 * @param {string} [baseDir=process.cwd()] - Root directory containing env files.
 * @returns {string[]} List of loaded env files.
 */
export function loadEnvFiles(baseDir = process.cwd()) {
  const envFiles = [".env.local", ".env"];
  const loaded = [];

  for (const file of envFiles) {
    const fullPath = path.resolve(baseDir, file);
    if (!fs.existsSync(fullPath)) continue;

    // Use native Node.js process.loadEnvFile if available (Node 20.12+)
    if (typeof process.loadEnvFile === "function") {
      try {
        process.loadEnvFile(fullPath);
        loaded.push(file);
        continue;
      } catch {
        // Fall back to manual parsing if file has formatting quirks
      }
    }

    // Graceful portable fallback parser
    try {
      const content = fs.readFileSync(fullPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) return;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx === -1) return;
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        if (process.env[key] === undefined) {
          process.env[key] = val;
        }
      });
      loaded.push(file);
    } catch (err) {
      console.warn(`[EnvLoader] Failed to read ${file}:`, err.message);
    }
  }

  return loaded;
}

export default loadEnvFiles;
