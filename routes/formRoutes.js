import express from "express";
import multer from "multer";

const router = express.Router();

// Configure in-memory storage for test uploads so disk space is not consumed
const formMemoryStorage = multer.memoryStorage();
const formUploadMulter = multer({
  storage: formMemoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per file limit
    files: 10, // Max 10 files
  },
});

/**
 * Format bytes into human-readable format (KB, MB, etc.)
 */
export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Middleware that selectively processes multipart/form-data with multer
 * if present, or delegates to standard JSON/URL-encoded body parsers.
 */
export function handleFormSubmissionData(req, res, next) {
  const contentType = (req.headers["content-type"] || "").toLowerCase();

  if (contentType.includes("multipart/form-data")) {
    formUploadMulter.any()(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: "File is too large. Maximum allowed size is 10MB per file.",
          });
        }
        if (err.code === "LIMIT_FILE_COUNT") {
          return res.status(400).json({
            success: false,
            error: "Too many files uploaded. Maximum allowed is 10 files.",
          });
        }
        return res.status(400).json({
          success: false,
          error: err.message || "Failed to process multipart form data",
        });
      }
      next();
    });
  } else {
    next();
  }
}

/**
 * Generates a modern, responsive HTML inspection page for testers
 * submitting via raw HTML forms in a browser with ?format=html.
 */
export function renderFormResponseHtml(payload) {
  const fieldsRows = Object.entries(payload.fields)
    .map(([key, value]) => {
      const displayVal =
        typeof value === "object" ? JSON.stringify(value, null, 2) : String(value);
      return `<tr>
        <td style="font-weight: 600; color: #2563eb;">${escapeHtml(key)}</td>
        <td style="color: #64748b; font-size: 13px;">${Array.isArray(value) ? "Array" : typeof value}</td>
        <td><code>${escapeHtml(displayVal)}</code></td>
      </tr>`;
    })
    .join("");

  const filesRows = payload.files
    .map((file) => {
      return `<tr>
        <td style="font-weight: 600; color: #7c3aed;">${escapeHtml(file.fieldName)}</td>
        <td>${escapeHtml(file.originalName)}</td>
        <td><span style="background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${escapeHtml(file.mimeType)}</span></td>
        <td>${escapeHtml(file.formattedSize)}</td>
      </tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Form Submission Test Echo</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
      padding: 30px 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      color: #ffffff;
      padding: 24px 30px;
    }
    .badge {
      display: inline-block;
      background: #10b981;
      color: #ffffff;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 8px;
    }
    .content { padding: 30px; }
    .meta-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
      background: #f1f5f9;
      padding: 16px;
      border-radius: 8px;
    }
    .meta-item strong { display: block; font-size: 12px; text-transform: uppercase; color: #64748b; }
    .meta-item span { font-size: 14px; font-weight: 600; color: #1e293b; }
    h2 { font-size: 18px; margin: 24px 0 12px; color: #1e293b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    th { background: #f8fafc; font-weight: 600; color: #475569; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
    pre {
      background: #0f172a;
      color: #38bdf8;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-size: 13px;
    }
    .empty-state { color: #94a3b8; font-style: italic; padding: 12px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">Echo Test Mode</div>
      <h1>Form Submission Received</h1>
      <p style="opacity: 0.8; font-size: 14px; margin-top: 4px;">Data inspected and echoed back for testing. No records were stored on the server.</p>
    </div>
    <div class="content">
      <div class="meta-grid">
        <div class="meta-item"><strong>Method</strong><span>${escapeHtml(payload.method)}</span></div>
        <div class="meta-item"><strong>Content-Type</strong><span>${escapeHtml(payload.contentType)}</span></div>
        <div class="meta-item"><strong>Fields Count</strong><span>${payload.fieldsCount}</span></div>
        <div class="meta-item"><strong>Files Count</strong><span>${payload.filesCount}</span></div>
      </div>

      <h2>Submitted Fields (${payload.fieldsCount})</h2>
      ${
        payload.fieldsCount > 0
          ? `<table>
              <thead>
                <tr>
                  <th style="width: 25%;">Field Name</th>
                  <th style="width: 20%;">Detected Type</th>
                  <th>Submitted Value</th>
                </tr>
              </thead>
              <tbody>${fieldsRows}</tbody>
            </table>`
          : `<p class="empty-state">No text fields were submitted.</p>`
      }

      <h2>Uploaded Files (${payload.filesCount})</h2>
      ${
        payload.filesCount > 0
          ? `<table>
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Original Filename</th>
                  <th>MIME Type</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody>${filesRows}</tbody>
            </table>`
          : `<p class="empty-state">No files were attached in this submission.</p>`
      }

      <h2>Raw JSON Response</h2>
      <pre><code>${escapeHtml(JSON.stringify(payload, null, 2))}</code></pre>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (typeof str !== "string") return String(str);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Controller handling form test submissions.
 * Echoes all submitted fields and files without persisting anything.
 */
export function formSubmitHandler(req, res) {
  const method = req.method;
  const contentType = req.headers["content-type"] || "None";

  // Merge body fields (POST/PUT/PATCH) or query parameters (GET)
  const submittedFields = { ...(req.body || {}) };
  const queryParams = req.query || {};
  const activeFields =
    Object.keys(submittedFields).length > 0
      ? submittedFields
      : method === "GET"
        ? queryParams
        : {};

  // Extract uploaded files metadata from memory storage
  const uploadedFiles = Array.isArray(req.files)
    ? req.files.map((file) => ({
        fieldName: file.fieldname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        formattedSize: formatBytes(file.size),
      }))
    : [];

  const fieldsCount = Object.keys(activeFields).length;
  const filesCount = uploadedFiles.length;

  const responsePayload = {
    success: true,
    message:
      "Form submission received successfully. (Echo test mode: Data is not saved)",
    receivedAt: new Date().toISOString(),
    method,
    contentType,
    fieldsCount,
    fields: activeFields,
    filesCount,
    files: uploadedFiles,
    queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
  };

  // If tester explicitly requests HTML format via ?format=html, render visual report
  if (req.query.format === "html") {
    return res.type("html").send(renderFormResponseHtml(responsePayload));
  }

  return res.json(responsePayload);
}

// Register testing routes (supports POST, GET, PUT, PATCH without auth or validation)
router.all(
  ["/forms/submit", "/forms/test", "/form-submit"],
  handleFormSubmissionData,
  formSubmitHandler,
);

export default router;
