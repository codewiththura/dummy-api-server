# Social App API Server

A modular, high-performance Node.js & Express mock backend API server designed specifically for **testing, frontend prototyping, mobile app development, and learning**.

This server provides a zero-configuration, in-memory database pre-seeded with realistic dummy data (users, posts, comments), an intelligent **`userId: 1` default fallback mechanism** for friction-free testing without requiring login sessions, rate-limiting protection, and a storage-optimized photo upload system with deterministic ID-based overwriting.

---

## Table of Contents

- [Overview & Mock Testing Purpose](#overview--mock-testing-purpose)
- [Pre-Seeded Dummy Information](#pre-seeded-dummy-information)
  - [Pre-Seeded Users](#pre-seeded-users)
  - [Pre-Seeded Posts](#pre-seeded-posts)
  - [Pre-Seeded Comments](#pre-seeded-comments)
  - [In-Memory Lifecycle & State Resets](#in-memory-lifecycle--state-resets)
- [Default User (`userId: 1`) Fallback System](#default-user-userid-1-fallback-system)
  - [Why Default to User 1?](#why-default-to-user-1)
  - [Endpoints Utilizing the Fallback](#endpoints-utilizing-the-fallback)
  - [Authenticating as Another User](#authenticating-as-another-user)
- [Image Upload & Handling Architecture](#image-upload--handling-architecture)
  - [Allowed Image MIME Types](#allowed-image-mime-types)
  - [File Size Limits](#file-size-limits)
  - [Storage Location & File Naming Convention](#storage-location--file-naming-convention)
  - [Deterministic ID-Based Overwriting Strategy](#deterministic-id-based-overwriting-strategy)
  - [Public Upload Access & Entity Validation](#public-upload-access--entity-validation)
  - [Accepted Multipart Form Field Names](#accepted-multipart-form-field-names)
  - [Static File Serving & Response Format](#static-file-serving--response-format)
- [Form Testing & Echo System](#form-testing--echo-system)
  - [Zero-Validation & Zero-Persistence Model](#zero-validation--zero-persistence-model)
  - [Supported Content Types & Field Handling](#supported-content-types--field-handling)
  - [Memory-Safe File Attachments](#memory-safe-file-attachments)
  - [HTML Visual Inspection Dashboard](#html-visual-inspection-dashboard)
- [Core Features](#core-features)
- [Rate Limiting Architecture](#rate-limiting-architecture)
- [Post Archiving & Security Rules](#post-archiving--security-rules)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Setup & Configuration](#environment-setup--configuration)
- [Step-by-Step Setup Guide](#step-by-step-setup-guide)
  - [Running Locally (Development)](#running-locally-development)
  - [Running with Docker (Containerized on VPS)](#running-with-docker-containerized-on-vps)
  - [Re-deploying on VPS (Updating Container)](#re-deploying-on-vps-updating-container)
  - [Deploying via Git Container Registry (GHCR) & GitHub Actions](#deploying-via-git-container-registry-ghcr--github-actions)
    - [Automated CI/CD Pipeline (GitHub Actions)](#automated-cicd-pipeline-github-actions)
    - [Deploying / Updating Container on VPS](#deploying--updating-container-on-vps)
    - [Manual Build & Push Alternative](#manual-build--push-alternative)
- [Complete API Reference](#complete-api-reference)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Posts Endpoints](#posts-endpoints)
  - [Photo Upload Endpoints](#photo-upload-endpoints)
  - [Form Testing Endpoints](#form-testing-endpoints)
  - [Comments Endpoints](#comments-endpoints)
  - [Users Endpoints](#users-endpoints)
- [Testing Guide (cURL & Postman)](#testing-guide-curl--postman)

---

## Overview & Mock Testing Purpose

When building frontend user interfaces (e.g., React, Next.js, Vue, Svelte) or mobile applications (React Native, Flutter, Swift, Kotlin), configuring and maintaining a live production database (such as PostgreSQL, MySQL, or MongoDB) introduces unnecessary complexity, migration overhead, and setup friction.

The **Social App API Server** acts as a lightweight, zero-maintenance mock backend API:
- **No external database required**: Runs entirely using in-memory JavaScript data structures.
- **Pre-populated with rich mock data**: Out of the box, the server contains realistic profiles, avatars, feeds, likes, saves, and comments.
- **Friction-free CRUD & interactions**: Features a built-in default user fallback (`userId: 1`) so developers and QA testers can immediately create, update, delete, like, save, or comment on posts without having to go through a login/token authentication flow first.
- **Public image upload support**: Clients can test avatar and post photo uploads without complex auth handshakes, with automatic storage management to keep container disk footprints small.

---

## Pre-Seeded Dummy Information

Upon server startup, the in-memory database is automatically populated with the following dummy records:

### Pre-Seeded Users

All pre-seeded test accounts share the default password: **`password123`**.

| ID | Name | Username | Email | Default Avatar | Bio |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** *(Default)* | Thura | `thura` | `thura@example.com` | `https://i.pravatar.cc/150?img=68` | Passionate React & Node.js Developer. |
| **2** | May Thin | `maythin` | `maythin@example.com` | `https://i.pravatar.cc/150?u=maythin` | Frontend UI/UX enthusiast and technical writer. |
| **3** | Zaw Min | `zawmin` | `zawmin@example.com` | `https://i.pravatar.cc/150?u=zawmin` | Fullstack engineer passionate about clean architecture. |
| **4** | Hla Hla | `hlahla` | `hlahla@example.com` | `https://i.pravatar.cc/150?u=hlahla` | Mobile and Single Page Application enthusiast. |
| **5** | Kyaw Thu | `kyawthu` | `kyawthu@example.com` | `https://i.pravatar.cc/150?u=kyawthu` | Software Architect & Tech Instructor. |
| **6** | Su Su | `susu` | `susu@example.com` | `https://i.pravatar.cc/150?u=susu` | React and Next.js Frontend Developer. |

### Pre-Seeded Posts

The initial feed includes 4 educational posts with author linkages, Unsplash cover images, and pre-existing like/save states:

| Post ID | Author | Title | Pre-configured Likes | Initial Saved By |
| :---: | :---: | :--- | :---: | :---: |
| **1** | User 1 (Thura) | *Getting Started with React* | 4 likes (Users 2, 3, 4, 5) | User 2 |
| **2** | User 2 (May Thin) | *Understanding useState Hook* | 3 likes (Users 1, 3, 4) | Users 1, 3 |
| **3** | User 3 (Zaw Min) | *Props and Component Communication* | 4 likes (Users 1, 2, 4, 6) | User 2 |
| **4** | User 4 (Hla Hla) | *React Router for Navigation* | 4 likes (Users 1, 2, 3, 5) | Users 1, 5 |

### Pre-Seeded Comments

Post 1 includes initial comments:
- **Comment 101**: Authored by May Thin (User 2)
- **Comment 102**: Authored by Zaw Min (User 3)

### In-Memory Lifecycle & State Resets

> [!NOTE]
> **Data Ephemerality**: Because data is stored in server memory (`let users = [...]`, `let posts = [...]`, `let comments = [...]`), any posts created, edited, liked, or deleted will **reset to initial dummy data whenever the Node process restarts**. Uploaded image files on disk persist independently if the `uploads/` directory is retained or volume-mounted.

---

## Default User (`userId: 1`) Fallback System

### Why Default to User 1?

In traditional backends, every write operation requires a JWT Bearer token or active session cookie. While realistic, this slows down rapid frontend prototyping, UI design iterations, and API exploration in Postman or cURL.

To provide the smoothest developer experience, **this API defaults to `userId: 1` ("Thura") whenever a request is unauthenticated or no user context is supplied**.

### Endpoints Utilizing the Fallback

| Operation | Endpoint | Fallback Behavior when Unauthenticated (`CURRENT_USER_ID === null`) |
| :--- | :--- | :--- |
| **Create Post** | `POST /api/posts` | Post author is automatically assigned as `userId: 1`. |
| **Edit Post** | `PUT /api/posts/:id` | Authorization checks `post.userId === (CURRENT_USER_ID \|\| 1)`, permitting direct edits to Post 1 (owned by User 1). |
| **Archive Post** | `POST /api/posts/:id/archive` | Authorization checks `post.userId === (CURRENT_USER_ID \|\| 1)`, permitting User 1 to archive/unarchive their posts. |
| **Delete Post** | `DELETE /api/posts/:id` | Authorization checks `post.userId === (CURRENT_USER_ID \|\| 1)`, permitting User 1 to delete their posts. |
| **Like / Unlike Post** | `POST /api/posts/:id/like` | Identifies user via `req.body.userId \|\| CURRENT_USER_ID \|\| 1`. Allows unauthenticated clients to toggle likes as User 1, or pass any custom `userId` in the body. |
| **Save / Unsave Post** | `POST /api/posts/:id/save` | Identifies user via `req.body.userId \|\| CURRENT_USER_ID \|\| 1`. Allows unauthenticated clients to toggle saves as User 1. |
| **Add Comment** | `POST /api/posts/:postId/comments` | Assigns comment `userId: CURRENT_USER_ID \|\| 1`. If `name` or `email` are omitted in the body, it auto-fills with User 1's profile details (`"Thura"`, `"thura@example.com"`). |

### Authenticating as Another User

If you want to simulate multi-user behavior or test permissions:
1. Call `POST /api/auth/login` with `{ "email": "maythin@example.com", "password": "password123" }`.
2. The server sets `CURRENT_USER_ID = 2`.
3. All subsequent requests will now act on behalf of User 2 (May Thin) until `POST /api/auth/logout` is called, which resets `CURRENT_USER_ID = null` (reverting back to the default `userId: 1` fallback).

---

## Image Upload & Handling Architecture

The server incorporates an image upload subsystem powered by [Multer](https://github.com/expressjs/multer) with custom storage engines, strict MIME validation, file size limits, and disk-space optimization.

### Allowed Image MIME Types

To maintain security and prevent arbitrary file uploads, only standard image formats are permitted:

| MIME Type | Supported File Extensions | Category | Status |
| :--- | :--- | :--- | :---: |
| `image/jpeg` | `.jpg`, `.jpeg` | JPEG Image | Allowed |
| `image/jpg` | `.jpg` | JPEG Image (variant) | Allowed |
| `image/png` | `.png` | Portable Network Graphics | Allowed |
| `image/gif` | `.gif` | Graphics Interchange Format | Allowed |
| `image/webp` | `.webp` | WebP Modern Image Format | Allowed |
| `image/svg+xml` | `.svg` | Scalable Vector Graphics | Allowed |

> [!WARNING]
> **MIME Type Enforcement**: Any upload with an unlisted MIME type (e.g., `application/pdf`, `video/mp4`, `text/plain`, `application/zip`) is immediately rejected with HTTP status **`400 Bad Request`**:
> ```json
> {
>   "error": "Invalid file type. Only image files (JPG, PNG, GIF, WEBP, SVG) are allowed."
> }
> ```

### File Size Limits

- **Maximum Allowed File Size**: **`5 MB`** (`5 * 1024 * 1024` bytes).
- Files exceeding 5 MB are rejected by the Multer size limiter with HTTP status **`400 Bad Request`**:
  ```json
  {
    "error": "File is too large. Maximum allowed size is 5MB."
  }
  ```

### Storage Location & File Naming Convention

Uploaded files are stored outside the source code tree in a dedicated `uploads` directory:

```text
social-app-api-server/
├── uploads/
│   ├── users/            <-- User profile avatars
│   │   ├── user-1.jpg
│   │   └── user-2.png
│   └── posts/            <-- Post cover images
│       ├── post-1.jpg
│       └── post-2.webp
```

- **User Profile Avatars**: Saved as `uploads/users/user-<userId>.<ext>`
- **Post Photos**: Saved as `uploads/posts/post-<postId>.<ext>`

### Deterministic ID-Based Overwriting Strategy

On resource-constrained environments (such as low-cost VPS instances or containerized nodes), user photo uploads can rapidly consume disk storage with abandoned, orphaned files.

To solve this:
1. When a new photo is uploaded for entity ID `X`, the helper function `removeExistingFiles()` searches the destination folder for any file matching the pattern:
   ```regex
   ^<prefix>-<id>\.[a-zA-Z0-9]+$
   ```
2. Any matching existing file (e.g., `user-1.png`) is unlinked and deleted from disk before the new file (e.g., `user-1.jpg`) is written.
3. **Zero Orphaned Files**: Even if a user updates their picture from a PNG to a JPG or WEBP, the old format is deleted, guaranteeing exactly one image file per user ID and post ID on disk at all times.

### Public Upload Access & Entity Validation

- **Is Public Upload Allowed?**: **Yes**. Because this server is tailored for frontend testing and sandbox experimentation, upload endpoints do **not** require authentication headers, tokens, or cookies. Any client, frontend application, or Postman tester can upload photos.
- **Entity Existence Validation Guard**:
  Before saving any file to disk, the server checks whether the target entity actually exists:
  - If `:id` is not a valid number: Returns `400 Bad Request` (`{"error": "Invalid user ID"}` or `{"error": "Invalid post ID"}`).
  - If the user or post is not found in memory: Returns `404 Not Found` (`{"error": "User not found"}` or `{"error": "Post not found"}`).
  - Only if the entity is validated does Multer process and save the file.

### Accepted Multipart Form Field Names

To eliminate frustration when switching between HTTP clients or frontend libraries, the upload middleware accepts any of the following multipart form field keys:
- `photo`
- `image`
- `avatar`
- `file`

If no file is attached under one of these keys, the server returns:
```json
{
  "error": "No image file uploaded. Please send a file with field name 'photo', 'image', 'avatar', or 'file'."
}
```

### Static File Serving & Response Format

All uploads are served statically by Express under the `/uploads` route:
- User Avatars: `http://<host>:5000/uploads/users/user-<id>.<ext>`
- Post Images: `http://<host>:5000/uploads/posts/post-<id>.<ext>`

When an upload succeeds, the server returns both relative and absolute URLs alongside entity metadata:
```json
{
  "message": "User profile photo uploaded successfully",
  "avatarUrl": "/uploads/users/user-1.jpg",
  "fullUrl": "http://localhost:5000/uploads/users/user-1.jpg",
  "filename": "user-1.jpg",
  "size": 45210,
  "user": {
    "id": 1,
    "name": "Thura",
    "avatarUrl": "/uploads/users/user-1.jpg",
    "updatedAt": "2026-10-18T12:00:00.000Z"
  }
}
```

---

## Form Testing & Echo System

Building forms in web and mobile applications often requires verifying that input fields, checkboxes, select menus, arrays, nested keys, and file attachments are sent correctly by the client. However, typical API endpoints enforce strict schema validation, require authenticated user sessions, and write data into databases.

To provide a dedicated sandbox for form testing, the server includes dedicated form testing endpoints:
- `POST /api/forms/submit` (primary)
- `POST /api/forms/test` (alias)
- `POST /api/form-submit` (alias)

### Zero-Validation & Zero-Persistence Model

- **No Authentication Required**: Form test routes are completely public and accessible without tokens, cookies, or headers.
- **No Schema Validation**: Submit any arbitrary fields, names, or values. The server will not reject requests for missing or unexpected fields.
- **No Data Persistence**: **The server does NOT save the submitted data to the database or files to disk.** It acts as an inspection mirror (echo server) that parses the payload and sends a structured report back to the tester.

### Supported Content Types & Field Handling

The route automatically detects and parses all standard HTML and JavaScript form submission formats:

| Content-Type | Client Method | Field Types Handled |
| :--- | :--- | :--- |
| **`application/x-www-form-urlencoded`** | Raw HTML `<form method="POST">` | Text inputs, passwords, numbers, radios, checkboxes (`"on"`/`"true"`), arrays (`tags[]`), nested objects (`profile[bio]`). |
| **`application/json`** | JS `fetch()`, `axios`, Postman | Strings, numbers, booleans, nested objects, and arrays. |
| **`multipart/form-data`** | `<form enctype="multipart/form-data">` or `new FormData()` | Text fields alongside file attachments. |
| **URL Query Parameters** | `<form method="GET">` or query strings | Parsed from `req.query` if request body is empty. |

### Memory-Safe File Attachments

When testing file inputs (`<input type="file">`):
- Uploaded files are processed in-memory using `multer.memoryStorage()`.
- **Zero Disk Footprint**: Files are **never written to disk**, preventing VPS or test server disk exhaustion.
- **Limits**: Up to **10 files** per submission, max **10 MB** per file.
- The response returns rich file metadata: `fieldName`, `originalName`, `mimeType`, `sizeBytes`, and human-readable `formattedSize`.

### Standard Echo Response (JSON)

By default, the server returns a clean JSON inspection response:

```json
{
  "success": true,
  "message": "Form submission received successfully. (Echo test mode: Data is not saved)",
  "receivedAt": "2026-10-18T12:40:00.000Z",
  "method": "POST",
  "contentType": "application/x-www-form-urlencoded",
  "fieldsCount": 4,
  "fields": {
    "username": "alex_tester",
    "email": "alex@example.com",
    "newsletter": "true",
    "role": "frontend-dev"
  },
  "filesCount": 1,
  "files": [
    {
      "fieldName": "resume",
      "originalName": "developer-cv.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 24576,
      "formattedSize": "24 KB"
    }
  ]
}
```

### HTML Visual Inspection Dashboard

If testers are submitting directly from a raw HTML form in a web browser without JavaScript, they can append **`?format=html`** to the form's `action` attribute:

```html
<form action="http://localhost:5000/api/forms/submit?format=html" method="POST" enctype="multipart/form-data">
  <!-- fields -->
</form>
```

When submitted, the browser will render a sleek, responsive visual report containing:
- Badges and metadata overview (HTTP method, content type, timestamp)
- Formatted table of all submitted text and input fields with detected types
- Formatted table of attached files with original names, MIME types, and sizes
- Formatted raw JSON payload block

---

## Core Features

- **Rate Limiting & DoS Protection**:
  - Sliding window rate limiting with background garbage collection.
  - Global API: `80 requests / 1 minute` per IP.
  - Auth Endpoints: `30 requests / 1 minute` per IP.
  - Standard headers returned: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`.
- **Authentication Simulation**:
  - `POST /api/auth/register` - Create test account.
  - `POST /api/auth/login` - Authenticate test account.
  - `GET /api/auth/me` - Fetch currently logged-in user.
  - `POST /api/auth/logout` - Clear active user session (reverts to `userId: 1` default).
- **Post Feed & Management**:
  - `GET /api/posts` - Retrieve public active posts feed.
  - `GET /api/posts?userId=X` - Filter posts authored by a specific user.
  - `GET /api/posts?archived=true` - Retrieve user's private archived posts (author-only).
  - `GET /api/posts/:id` - Fetch post details.
  - `POST /api/posts` - Create post (defaults author to `userId: 1` if unauthenticated).
  - `PUT /api/posts/:id` - Edit post title, body, or image (author only, defaults to user 1).
  - `POST /api/posts/:id/archive` - Toggle post archive visibility.
  - `DELETE /api/posts/:id` - Delete post and its attached comments.
  - `POST /api/posts/:id/like` - Toggle post like status (supports `userId` in body or defaults to 1).
  - `POST /api/posts/:id/save` - Toggle post save status (supports `userId` in body or defaults to 1).
- **Comments Subsystem**:
  - `GET /api/posts/:postId/comments` - Fetch all comments on a post.
  - `POST /api/posts/:postId/comments` - Create comment (defaults author to `userId: 1`).
- **User Directory**:
  - `GET /api/users` - List all mock user profiles.
  - `GET /api/users/:id` - Get user profile details.
  - `PUT /api/users/:id` - Update user bio, avatar, or details.
  - `DELETE /api/users/:id` - Remove a user profile.
- **Photo Upload System**:
  - `POST /api/users/:id/photo` (aliases: `/api/users/:id/avatar`, `/api/upload/user/:id`)
  - `POST /api/posts/:id/photo` (aliases: `/api/posts/:id/image`, `/api/upload/post/:id`)
- **Form Testing & Echo System**:
  - `POST /api/forms/submit` (aliases: `/api/forms/test`, `/api/form-submit`)
  - Universal parsing: handles URL-encoded, JSON, and multipart form submissions with file attachments.
  - Zero-persistence echo mode: returns parsed fields and file metadata for testing without saving to database or disk.
  - Optional visual inspection report via `?format=html`.

---

## Rate Limiting Architecture

| Limiter Scope | Target Endpoints | Window Duration | Max Requests | Limit Exceeded Status |
| :--- | :--- | :--- | :---: | :--- |
| **Global Limiter** | `/api/*` | 1 minute (60,000 ms) | 80 / IP | `429 Too Many Requests` |
| **Auth Limiter** | `/api/auth/login`, `/api/auth/register` | 1 minute (60,000 ms) | 30 / IP | `429 Too Many Requests` |

### HTTP Headers Returned

- `RateLimit-Limit` / `X-RateLimit-Limit`: Maximum requests allowed per window.
- `RateLimit-Remaining` / `X-RateLimit-Remaining`: Remaining requests in current window.
- `RateLimit-Reset` / `X-RateLimit-Reset`: UNIX epoch timestamp (seconds) when window resets.
- `Retry-After`: Seconds client must wait before retrying (included on HTTP 429 response).

---

## Post Archiving & Security Rules

1. **Owner-Only Modifications**:
   - Only the post creator (`post.userId === CURRENT_USER_ID`, or `post.userId === 1` if unauthenticated) can perform `PUT /api/posts/:id` (Edit), `POST /api/posts/:id/archive` (Archive), and `DELETE /api/posts/:id` (Delete).
   - Unauthorized attempts return `403 Forbidden`.
2. **Private Archive Visibility**:
   - Archived posts (`isArchived: true`) are excluded from general feeds (`GET /api/posts`).
   - Querying `GET /api/posts?archived=true` only returns archived posts belonging to the requesting user.
   - Accessing `GET /api/posts/:id` directly for an archived post by anyone other than the author yields `403 Forbidden`.

---

## Tech Stack

- **Runtime**: Node.js (ES Modules `type: "module"`)
- **Web Framework**: Express.js (v5)
- **Multipart Upload**: Multer (v2) with custom disk storage and ID overwrite logic
- **Middleware**: CORS, Express JSON Body Parser, Custom Rate Limiter, Static File Serving

---

## Prerequisites

- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **Docker**: (Optional) For containerized VPS deployment

---

## Environment Setup & Configuration

- **`PORT`**: Port number for HTTP server (default: `5000`).
- **CORS**: Enabled for all origins by default for easy cross-origin frontend testing.
- **Upload Directories**: `./uploads/users` and `./uploads/posts` are automatically verified and created on startup.

---

## Step-by-Step Setup Guide

### Running Locally (Development)

1. Clone or navigate to the repository directory:
   ```bash
   cd social-app-api-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the API server:
   ```bash
   node server.js
   ```

4. The server will start and listen at `http://localhost:5000`.

### Running Automated Tests

Run the native Node test runner to validate API endpoints, dummy seed data, unauthenticated `userId: 1` fallback, and image upload validation:
```bash
npm test
```

---

### Running with Docker (Containerized on VPS)

1. Build the Docker image:
   ```bash
   docker build -t social-app-api .
   ```

2. Run the container with a persistent volume for uploaded photos:
   ```bash
   docker run -d \
     --name social-app-api-container \
     -p 5000:5000 \
     -v $(pwd)/uploads:/usr/src/app/uploads \
     --restart unless-stopped \
     social-app-api
   ```

   > [!IMPORTANT]
   > **Volume Binding**: Binding `$(pwd)/uploads` on the host to `/usr/src/app/uploads` inside the container guarantees uploaded images survive container restarts and updates.

3. Verify container status:
   ```bash
   docker ps
   docker logs -f social-app-api-container
   ```

---

### Re-deploying on VPS (Updating Container)

When pulling newer code or Docker updates:

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild the image
docker build -t social-app-api .

# 3. Stop and replace the container
docker stop social-app-api-container
docker rm social-app-api-container

# 4. Restart container with uploads volume preserved
docker run -d \
  --name social-app-api-container \
  -p 5000:5000 \
  -v $(pwd)/uploads:/usr/src/app/uploads \
  --restart unless-stopped \
  social-app-api
```

---

### Deploying via Git Container Registry (GHCR) & GitHub Actions

This repository is equipped with an automated CI/CD pipeline powered by **GitHub Actions** located at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

#### Automated CI/CD Pipeline (GitHub Actions)

Whenever new code is pushed to the `main` branch (or triggered manually via `workflow_dispatch` in the GitHub Actions UI):
1. **Automated Test Stage**:
   - Spawns an isolated `ubuntu-latest` runner with Node.js 20.
   - Executes `npm ci` followed by `npm test` to validate all core API contracts, default `userId: 1` fallbacks, and photo upload filters.
2. **Docker Build & Publish Stage**:
   - Runs only after tests pass successfully.
   - Sets up Docker Buildx with GitHub Actions layer caching (`type=gha`) for fast builds.
   - Authenticates against GitHub Container Registry (`ghcr.io`) using the scoped `${{ secrets.GITHUB_TOKEN }}`.
   - Builds and tags the image:
     - `ghcr.io/<github-owner>/social-app-api-server:latest`
     - `ghcr.io/<github-owner>/social-app-api-server:sha-<short_sha>`
   - Pushes the resulting container image to GHCR.

> [!NOTE]
> **GitHub Package Visibility**: By default, packages published to GHCR might be private. In your GitHub repository under **Packages** &gt; **Package Settings**, ensure the package visibility is set to **Public** if your VPS pulls without a personal access token (PAT), or log in with a PAT on your VPS if keeping it private.

#### Deploying / Updating Container on VPS

On your production or staging VPS, pull and run the published container image:

```bash
# 1. Target image name (all lowercase in GHCR)
IMAGE_NAME="ghcr.io/codewiththura/social-app-api-server:latest"

# 2. (Optional) Log in if your GHCR package is private
# echo $GHCR_PAT | docker login ghcr.io -u <YOUR_GITHUB_USERNAME> --password-stdin

# 3. Pull the latest image built by GitHub Actions
docker pull $IMAGE_NAME

# 4. Ensure persistent upload folders exist on host
mkdir -p uploads/users uploads/posts

# 5. Stop and remove existing container
docker stop social-app-api-container || true
docker rm social-app-api-container || true

# 6. Run container with persistent uploads volume
docker run -d \
  --name social-app-api-container \
  -p 5000:5000 \
  -v $(pwd)/uploads:/usr/src/app/uploads \
  --restart unless-stopped \
  $IMAGE_NAME

# 7. Check container status & logs
docker ps
docker logs -f social-app-api-container
```

#### Manual Build & Push Alternative

If you ever need to manually build and push outside of GitHub Actions:

```bash
IMAGE_NAME="ghcr.io/<YOUR_GITHUB_USERNAME>/social-app-api-server:latest"

# Build image locally
docker build -t $IMAGE_NAME .

# Authenticate with Personal Access Token (classic with write:packages or fine-grained)
echo $GITHUB_TOKEN | docker login ghcr.io -u <YOUR_GITHUB_USERNAME> --password-stdin

# Push to registry
docker push $IMAGE_NAME
```

---

## Complete API Reference & Response Structures

All endpoints return standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `429 Too Many Requests`). All JSON responses use standard camelCase fields.

---

### Authentication Endpoints

#### 1. Register Account — `POST /api/auth/register`
- **Access**: Public
- **Rate Limit**: 30 req / min
- **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "password": "password123",
    "username": "alexm",
    "bio": "Frontend developer & tech enthusiast.",
    "avatarUrl": "https://i.pravatar.cc/150?u=alexm"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "id": 1729235000000,
    "name": "Alex Mercer",
    "username": "alexm",
    "email": "alex@example.com",
    "avatarUrl": "https://i.pravatar.cc/150?u=alexm",
    "bio": "Frontend developer & tech enthusiast.",
    "createdAt": "2026-10-23T08:30:00.000Z",
    "updatedAt": "2026-10-23T08:30:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Email and password are required"}` or `{"error": "Email already registered"}`

#### 2. Log In — `POST /api/auth/login`
- **Access**: Public
- **Rate Limit**: 30 req / min
- **Request Body**:
  ```json
  {
    "email": "thura@example.com",
    "password": "password123"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "id": 1,
    "name": "Thura",
    "username": "thura",
    "email": "thura@example.com",
    "avatarUrl": "https://i.pravatar.cc/150?img=68",
    "bio": "Passionate React & Node.js Developer.",
    "createdAt": "2026-08-01T10:00:00.000Z",
    "updatedAt": "2026-08-01T10:00:00.000Z"
  }
  ```
- **Error Response**:
  - `401 Unauthorized`: `{"error": "Invalid email or password"}`

#### 3. Get Current User Profile — `GET /api/auth/me`
- **Access**: Logged In (requires active session from `/api/auth/login` or register)
- **Rate Limit**: 80 req / min
- **Response (`200 OK`)**:
  ```json
  {
    "id": 1,
    "name": "Thura",
    "username": "thura",
    "email": "thura@example.com",
    "avatarUrl": "https://i.pravatar.cc/150?img=68",
    "bio": "Passionate React & Node.js Developer.",
    "createdAt": "2026-08-01T10:00:00.000Z",
    "updatedAt": "2026-08-01T10:00:00.000Z"
  }
  ```
- **Error Response**:
  - `401 Unauthorized`: `{"error": "Not authenticated"}`

#### 4. Log Out — `POST /api/auth/logout`
- **Access**: Public
- **Response (`200 OK`)**:
  ```json
  {
    "success": true
  }
  ```

---

### Posts Endpoints

#### 1. List Posts — `GET /api/posts`
- **Access**: Public
- **Query Parameters**:
  - `userId` (optional): Filter posts by specific author ID (e.g. `?userId=2`).
  - `archived` (optional): If `true`, returns user's private archived posts (only visible to logged-in author).
- **Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "userId": 1,
      "title": "Getting Started with React",
      "body": "React is a JavaScript library for building user interfaces.",
      "imageUrl": "https://unsplash.com/photos/4hbJ-eymZ1o/download?force=true&w=640",
      "likes": [2, 3, 4, 5],
      "likesCount": 4,
      "isLiked": false,
      "savedBy": [2],
      "isSaved": false,
      "isArchived": false,
      "createdAt": "2026-08-20T10:00:00.000Z",
      "updatedAt": "2026-08-20T10:00:00.000Z",
      "author": {
        "id": 1,
        "name": "Thura",
        "username": "thura",
        "avatarUrl": "https://i.pravatar.cc/150?img=68"
      }
    }
  ]
  ```

#### 2. Get Post Details — `GET /api/posts/:id`
- **Access**: Public (Author only if archived)
- **Response (`200 OK`)**:
  ```json
  {
    "id": 1,
    "userId": 1,
    "title": "Getting Started with React",
    "body": "React is a JavaScript library for building user interfaces.",
    "imageUrl": "https://unsplash.com/photos/4hbJ-eymZ1o/download?force=true&w=640",
    "likes": [2, 3, 4, 5],
    "likesCount": 4,
    "isLiked": false,
    "savedBy": [2],
    "isSaved": false,
    "isArchived": false,
    "createdAt": "2026-08-20T10:00:00.000Z",
    "updatedAt": "2026-08-20T10:00:00.000Z",
    "author": {
      "id": 1,
      "name": "Thura",
      "username": "thura",
      "avatarUrl": "https://i.pravatar.cc/150?img=68"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"error": "Post not found"}`
  - `403 Forbidden`: `{"error": "Archived post can only be viewed by its author"}`

#### 3. Create Post — `POST /api/posts`
- **Access**: Public (Defaults to `userId: 1` if not logged in)
- **Request Body**:
  ```json
  {
    "title": "Mastering Async/Await in JavaScript",
    "body": "Promises and async/await simplify asynchronous flow.",
    "imageUrl": "https://picsum.photos/seed/async/600/350"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "id": 1729236100000,
    "userId": 1,
    "title": "Mastering Async/Await in JavaScript",
    "body": "Promises and async/await simplify asynchronous flow.",
    "imageUrl": "https://picsum.photos/seed/async/600/350",
    "likes": [],
    "likesCount": 0,
    "isLiked": false,
    "savedBy": [],
    "isSaved": false,
    "isArchived": false,
    "createdAt": "2026-10-23T08:35:00.000Z",
    "updatedAt": "2026-10-23T08:35:00.000Z",
    "author": {
      "id": 1,
      "name": "Thura",
      "username": "thura",
      "avatarUrl": "https://i.pravatar.cc/150?img=68"
    }
  }
  ```
- **Error Response**:
  - `400 Bad Request`: `{"error": "Title is required"}`

#### 4. Update Post — `PUT /api/posts/:id`
- **Access**: Post Author (Defaults to `userId: 1`)
- **Request Body**:
  ```json
  {
    "title": "Updated Title: React & Redux Toolkit",
    "body": "Updated body description."
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "id": 1,
    "userId": 1,
    "title": "Updated Title: React & Redux Toolkit",
    "body": "Updated body description.",
    "imageUrl": "https://unsplash.com/photos/4hbJ-eymZ1o/download?force=true&w=640",
    "likes": [2, 3, 4, 5],
    "likesCount": 4,
    "isLiked": false,
    "savedBy": [2],
    "isSaved": false,
    "isArchived": false,
    "createdAt": "2026-08-20T10:00:00.000Z",
    "updatedAt": "2026-10-23T08:36:00.000Z",
    "author": {
      "id": 1,
      "name": "Thura",
      "username": "thura",
      "avatarUrl": "https://i.pravatar.cc/150?img=68"
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"error": "Post not found"}`
  - `403 Forbidden`: `{"error": "Unauthorized: You can only edit your own posts"}`

#### 5. Archive / Unarchive Post — `POST /api/posts/:id/archive`
- **Access**: Post Author (Defaults to `userId: 1`)
- **Request Body (optional)**:
  ```json
  {
    "isArchived": true
  }
  ```
  *(If omitted, toggles current archive status)*
- **Response (`200 OK`)**:
  ```json
  {
    "id": 1,
    "userId": 1,
    "title": "Getting Started with React",
    "isArchived": true,
    "updatedAt": "2026-10-23T08:37:00.000Z",
    "author": {
      "id": 1,
      "name": "Thura",
      "username": "thura",
      "avatarUrl": "https://i.pravatar.cc/150?img=68"
    }
  }
  ```

#### 6. Delete Post — `DELETE /api/posts/:id`
- **Access**: Post Author (Defaults to `userId: 1`)
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "deletedPostId": 1,
    "deletedPost": {
      "id": 1,
      "userId": 1,
      "title": "Getting Started with React",
      "author": {
        "id": 1,
        "name": "Thura",
        "username": "thura",
        "avatarUrl": "https://i.pravatar.cc/150?img=68"
      }
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: `{"error": "Post not found"}`
  - `403 Forbidden`: `{"error": "Unauthorized: You can only delete your own posts"}`

#### 7. Like / Unlike Post — `POST /api/posts/:id/like`
- **Access**: Public
- **Request Body (optional)**:
  ```json
  {
    "userId": 2
  }
  ```
  *(Defaults to active user or `userId: 1` if omitted)*
- **Response (`200 OK`)**:
  ```json
  {
    "id": 1,
    "likes": [2, 3, 4, 5, 1],
    "likesCount": 5,
    "isLiked": true,
    "updatedAt": "2026-10-23T08:38:00.000Z",
    "author": {
      "id": 1,
      "name": "Thura",
      "username": "thura",
      "avatarUrl": "https://i.pravatar.cc/150?img=68"
    }
  }
  ```

#### 8. Save / Unsave Post — `POST /api/posts/:id/save`
- **Access**: Public
- **Request Body (optional)**:
  ```json
  {
    "userId": 2
  }
  ```
  *(Defaults to active user or `userId: 1` if omitted)*
- **Response (`200 OK`)**:
  ```json
  {
    "id": 1,
    "savedBy": [2, 1],
    "isSaved": true,
    "updatedAt": "2026-10-23T08:39:00.000Z",
    "author": {
      "id": 1,
      "name": "Thura",
      "username": "thura",
      "avatarUrl": "https://i.pravatar.cc/150?img=68"
    }
  }
  ```

---

### Photo Upload Endpoints

#### 1. Upload User Avatar — `POST /api/users/:id/photo`
- **Aliases**: `/api/users/:id/avatar`, `/api/upload/user/:id`
- **Content-Type**: `multipart/form-data`
- **Accepted Field Names**: `photo`, `image`, `avatar`, `file`
- **Allowed Types**: JPG, PNG, GIF, WEBP, SVG (&le; 5 MB)
- **Response (`200 OK`)**:
  ```json
  {
    "message": "User profile photo uploaded successfully",
    "avatarUrl": "/uploads/users/user-1.jpg",
    "fullUrl": "http://localhost:5000/uploads/users/user-1.jpg",
    "filename": "user-1.jpg",
    "size": 45210,
    "user": {
      "id": 1,
      "name": "Thura",
      "username": "thura",
      "email": "thura@example.com",
      "avatarUrl": "/uploads/users/user-1.jpg",
      "bio": "Passionate React & Node.js Developer.",
      "createdAt": "2026-08-01T10:00:00.000Z",
      "updatedAt": "2026-10-23T08:40:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "Invalid file type. Only image files (JPG, PNG, GIF, WEBP, SVG) are allowed."}` or `{"error": "File is too large. Maximum allowed size is 5MB."}`
  - `404 Not Found`: `{"error": "User not found"}`

#### 2. Upload Post Cover Image — `POST /api/posts/:id/photo`
- **Aliases**: `/api/posts/:id/image`, `/api/upload/post/:id`
- **Content-Type**: `multipart/form-data`
- **Accepted Field Names**: `photo`, `image`, `avatar`, `file`
- **Allowed Types**: JPG, PNG, GIF, WEBP, SVG (&le; 5 MB)
- **Response (`200 OK`)**:
  ```json
  {
    "message": "Post photo uploaded successfully",
    "imageUrl": "/uploads/posts/post-1.png",
    "fullUrl": "http://localhost:5000/uploads/posts/post-1.png",
    "filename": "post-1.png",
    "size": 89124,
    "post": {
      "id": 1,
      "userId": 1,
      "title": "Getting Started with React",
      "imageUrl": "/uploads/posts/post-1.png",
      "likes": [2, 3, 4, 5],
      "likesCount": 4,
      "isLiked": false,
      "savedBy": [2],
      "isSaved": false,
      "isArchived": false,
      "createdAt": "2026-08-20T10:00:00.000Z",
      "updatedAt": "2026-10-23T08:41:00.000Z",
      "author": {
        "id": 1,
        "name": "Thura",
        "username": "thura",
        "avatarUrl": "https://i.pravatar.cc/150?img=68"
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{"error": "File is too large. Maximum allowed size is 5MB."}`
  - `404 Not Found`: `{"error": "Post not found"}`

---

### Form Testing & Echo Endpoints

#### Submit / Echo Form Data — `POST` / `GET` / `PUT` / `PATCH` `/api/forms/submit`
- **Aliases**: `/api/forms/test`, `/api/form-submit`
- **Content-Types**: `application/x-www-form-urlencoded`, `application/json`, `multipart/form-data`
- **Query Parameter**: `?format=html` (renders styled visual dashboard inside browser)
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Form submission received successfully. (Echo test mode: Data is not saved)",
    "receivedAt": "2026-10-23T08:42:00.000Z",
    "method": "POST",
    "contentType": "application/json",
    "fieldsCount": 3,
    "fields": {
      "fullName": "Alice Smith",
      "department": "Engineering",
      "subscribe": true
    },
    "filesCount": 1,
    "files": [
      {
        "fieldName": "resume",
        "originalName": "resume.pdf",
        "mimeType": "application/pdf",
        "sizeBytes": 204800,
        "formattedSize": "200 KB"
      }
    ]
  }
  ```

---

### Comments Endpoints

#### 1. List Comments for a Post — `GET /api/posts/:postId/comments`
- **Access**: Public
- **Response (`200 OK`)**:
  ```json
  [
    {
      "id": 101,
      "postId": 1,
      "userId": 2,
      "name": "May Thin",
      "email": "maythin@example.com",
      "body": "This is a great introduction to React! Very helpful for beginners.",
      "createdAt": "2026-08-20T11:00:00.000Z"
    },
    {
      "id": 102,
      "postId": 1,
      "userId": 3,
      "name": "Zaw Min",
      "email": "zawmin@example.com",
      "body": "I learned a lot from this post. Thanks for sharing!",
      "createdAt": "2026-08-20T12:30:00.000Z"
    }
  ]
  ```

#### 2. Create Comment — `POST /api/posts/:postId/comments`
- **Access**: Public (Defaults to active user or `userId: 1`)
- **Request Body**:
  ```json
  {
    "body": "Awesome post! Looking forward to part two."
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "id": 1729237000000,
    "postId": 1,
    "userId": 1,
    "name": "Thura",
    "email": "thura@example.com",
    "body": "Awesome post! Looking forward to part two.",
    "createdAt": "2026-10-23T08:43:00.000Z"
  }
  ```
- **Error Response**:
  - `400 Bad Request`: `{"error": "Comment body is required"}`

---

### Users Endpoints

#### 1. List Users — `GET /api/users`
- **Access**: Public
- **Response (`200 OK`)**:
  ```json
  [
    {
      "id": 1,
      "name": "Thura",
      "username": "thura",
      "email": "thura@example.com",
      "avatarUrl": "https://i.pravatar.cc/150?img=68",
      "bio": "Passionate React & Node.js Developer.",
      "createdAt": "2026-08-01T10:00:00.000Z",
      "updatedAt": "2026-08-01T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "May Thin",
      "username": "maythin",
      "email": "maythin@example.com",
      "avatarUrl": "https://i.pravatar.cc/150?u=maythin",
      "bio": "Frontend UI/UX enthusiast and technical writer.",
      "createdAt": "2026-08-02T10:00:00.000Z",
      "updatedAt": "2026-08-02T10:00:00.000Z"
    }
  ]
  ```

#### 2. Get User by ID — `GET /api/users/:id`
- **Access**: Public
- **Response (`200 OK`)**:
  ```json
  {
    "id": 1,
    "name": "Thura",
    "username": "thura",
    "email": "thura@example.com",
    "avatarUrl": "https://i.pravatar.cc/150?img=68",
    "bio": "Passionate React & Node.js Developer.",
    "createdAt": "2026-08-01T10:00:00.000Z",
    "updatedAt": "2026-08-01T10:00:00.000Z"
  }
  ```
- **Error Response**:
  - `404 Not Found`: `{"error": "User not found"}`

#### 3. Update User — `PUT /api/users/:id`
- **Access**: Public
- **Request Body**:
  ```json
  {
    "name": "Thura (Updated)",
    "bio": "Senior Fullstack Engineer & Open Source Contributor."
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "id": 1,
    "name": "Thura (Updated)",
    "username": "thura",
    "email": "thura@example.com",
    "avatarUrl": "https://i.pravatar.cc/150?img=68",
    "bio": "Senior Fullstack Engineer & Open Source Contributor.",
    "createdAt": "2026-08-01T10:00:00.000Z",
    "updatedAt": "2026-10-23T08:44:00.000Z"
  }
  ```
- **Error Response**:
  - `404 Not Found`: `{"error": "User not found"}`

#### 4. Delete User — `DELETE /api/users/:id`
- **Access**: Public
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "deletedUser": {
      "id": 6,
      "name": "Su Su",
      "username": "susu",
      "email": "susu@example.com",
      "avatarUrl": "https://i.pravatar.cc/150?u=susu",
      "bio": "React and Next.js Frontend Developer.",
      "createdAt": "2026-08-06T13:00:00.000Z",
      "updatedAt": "2026-08-06T13:00:00.000Z"
    }
  }
  ```
- **Error Response**:
  - `404 Not Found`: `{"error": "User not found"}`

---

## Testing Guide (cURL & Postman)

### 1. Creating a Post Without Logging In (Verifying `userId: 1` Default)

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Exploring Node.js Mock Server",
    "body": "Testing post creation without an authentication token!"
  }'
```

Response:
```json
{
  "id": 1729234567890,
  "userId": 1,
  "title": "Exploring Node.js Mock Server",
  "body": "Testing post creation without an authentication token!",
  "imageUrl": "https://picsum.photos/seed/1729234567890/600/350",
  "likes": [],
  "likesCount": 0,
  "savedBy": [],
  "isSaved": false,
  "isArchived": false,
  "author": {
    "id": 1,
    "name": "Thura",
    "username": "thura",
    "avatarUrl": "https://i.pravatar.cc/150?img=68"
  }
}
```

---

### 2. Uploading a User Profile Photo

Using **cURL**:
```bash
curl -X POST http://localhost:5000/api/users/1/photo \
  -F "photo=@/path/to/avatar.jpg"
```

Response:
```json
{
  "message": "User profile photo uploaded successfully",
  "avatarUrl": "/uploads/users/user-1.jpg",
  "fullUrl": "http://localhost:5000/uploads/users/user-1.jpg",
  "filename": "user-1.jpg",
  "size": 45210,
  "user": {
    "id": 1,
    "name": "Thura",
    "username": "thura",
    "email": "thura@example.com",
    "avatarUrl": "/uploads/users/user-1.jpg",
    "bio": "Passionate React & Node.js Developer.",
    "updatedAt": "2026-10-18T12:30:00.000Z"
  }
}
```

Using **Postman**:
1. Method: `POST`
2. URL: `http://localhost:5000/api/users/1/photo`
3. Body: Select `form-data`
4. Key: Type `photo` (or `avatar` or `image`), set type dropdown to **File**
5. Value: Choose an image (JPG, PNG, GIF, WEBP, or SVG under 5MB)
6. Send request.

---

### 3. Uploading a Post Photo

Using **cURL**:
```bash
curl -X POST http://localhost:5000/api/posts/1/photo \
  -F "image=@/path/to/cover.png"
```

Response:
```json
{
  "message": "Post photo uploaded successfully",
  "imageUrl": "/uploads/posts/post-1.png",
  "fullUrl": "http://localhost:5000/uploads/posts/post-1.png",
  "filename": "post-1.png",
  "size": 89124,
  "post": {
    "id": 1,
    "userId": 1,
    "title": "Getting Started with React",
    "imageUrl": "/uploads/posts/post-1.png",
    "updatedAt": "2026-10-18T12:35:00.000Z"
  }
}
```

---

### 4. Testing Upload Error Scenarios

#### Testing Invalid File Type (e.g. uploading a `.pdf` or `.txt` file):
```bash
curl -X POST http://localhost:5000/api/users/1/photo \
  -F "photo=@/path/to/document.pdf"
```

Response (`400 Bad Request`):
```json
{
  "error": "Invalid file type. Only image files (JPG, PNG, GIF, WEBP, SVG) are allowed."
}
```

#### Testing File Size Exceeded (> 5 MB):
```bash
curl -X POST http://localhost:5000/api/users/1/photo \
  -F "photo=@/path/to/large_image_8mb.jpg"
```

Response (`400 Bad Request`):
```json
{
  "error": "File is too large. Maximum allowed size is 5MB."
}
```

#### Testing Non-Existent User or Post ID:
```bash
curl -X POST http://localhost:5000/api/users/9999/photo \
  -F "photo=@/path/to/avatar.jpg"
```

Response (`404 Not Found`):
```json
{
  "error": "User not found"
}
```

---

### 5. Verifying Deterministic ID Overwrite

1. Upload `avatar.jpg` for User 1:
   - Check `./uploads/users/` — `user-1.jpg` is created.
2. Upload `avatar.webp` for User 1:
   - Check `./uploads/users/` — `user-1.jpg` is automatically unlinked and replaced with `user-1.webp`.
3. Disk space remains lean with exactly one image per ID.

---

### 6. Testing Raw HTML Forms (`application/x-www-form-urlencoded`)

Use a standard raw HTML `<form>` to test text fields, radios, checkboxes, and select menus:

```html
<form action="http://localhost:5000/api/forms/submit" method="POST">
  <label>Username: <input type="text" name="username" value="johndoe" /></label><br>
  <label>Email: <input type="email" name="email" value="john@example.com" /></label><br>
  <label>Role:
    <select name="role">
      <option value="developer" selected>Developer</option>
      <option value="designer">Designer</option>
    </select>
  </label><br>
  <label><input type="checkbox" name="newsletter" value="yes" checked /> Subscribe</label><br>
  <button type="submit">Submit Form</button>
</form>
```

Testing via **cURL**:
```bash
curl -X POST http://localhost:5000/api/forms/submit \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=johndoe&email=john%40example.com&role=developer&newsletter=yes"
```

Response:
```json
{
  "success": true,
  "message": "Form submission received successfully. (Echo test mode: Data is not saved)",
  "receivedAt": "2026-10-18T12:45:00.000Z",
  "method": "POST",
  "contentType": "application/x-www-form-urlencoded",
  "fieldsCount": 4,
  "fields": {
    "username": "johndoe",
    "email": "john@example.com",
    "role": "developer",
    "newsletter": "yes"
  },
  "filesCount": 0,
  "files": []
}
```

---

### 7. Testing JavaScript JSON Form Submissions (`application/json`)

Using client-side JavaScript (`fetch`):
```javascript
const formData = {
  fullName: "Alice Smith",
  department: "Engineering",
  skills: ["React", "Node.js", "Docker"],
  notifications: true
};

const response = await fetch("http://localhost:5000/api/forms/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData)
});

const result = await response.json();
console.log("Form Echo Result:", result);
```

Response:
```json
{
  "success": true,
  "message": "Form submission received successfully. (Echo test mode: Data is not saved)",
  "receivedAt": "2026-10-18T12:46:00.000Z",
  "method": "POST",
  "contentType": "application/json",
  "fieldsCount": 4,
  "fields": {
    "fullName": "Alice Smith",
    "department": "Engineering",
    "skills": ["React", "Node.js", "Docker"],
    "notifications": true
  },
  "filesCount": 0,
  "files": []
}
```

---

### 8. Testing Multipart Forms with Attached Files (`multipart/form-data`)

HTML Form with file attachment:
```html
<form action="http://localhost:5000/api/forms/submit" method="POST" enctype="multipart/form-data">
  <input type="text" name="feedbackTitle" value="Great API!" />
  <input type="file" name="screenshot" />
  <button type="submit">Submit Feedback</button>
</form>
```

Using **cURL**:
```bash
curl -X POST http://localhost:5000/api/forms/submit \
  -F "feedbackTitle=Great API!" \
  -F "screenshot=@/path/to/screenshot.png"
```

Response:
```json
{
  "success": true,
  "message": "Form submission received successfully. (Echo test mode: Data is not saved)",
  "receivedAt": "2026-10-18T12:47:00.000Z",
  "method": "POST",
  "contentType": "multipart/form-data; boundary=...",
  "fieldsCount": 1,
  "fields": {
    "feedbackTitle": "Great API!"
  },
  "filesCount": 1,
  "files": [
    {
      "fieldName": "screenshot",
      "originalName": "screenshot.png",
      "mimeType": "image/png",
      "sizeBytes": 54200,
      "formattedSize": "52.93 KB"
    }
  ]
}
```

---

### 9. Browser In-Place Visual Inspection (`?format=html`)

When testing directly inside a browser without opening developer tools, submit to `http://localhost:5000/api/forms/submit?format=html`.

The server responds with an HTML page featuring:
- Visual badges for HTTP method and content type.
- A styled table of all submitted text fields and detected types.
- A styled table of attached files with original names, MIME types, and sizes.
- Formatted raw JSON payload box for quick copying.

