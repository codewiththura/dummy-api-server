# Social App API Server

This is a modular, high-performance Node.js Express API server for the Social Application. It features an in-memory database management system to handle users, authentication, posts (with edit, delete, and private archiving capabilities), post comments, rate-limiting request protection, and a storage-optimized photo upload system designed for beginner testing and containerized VPS deployment.

---

## Features

- **Rate Limiting & Security**:
  - In-memory rate limiting middleware with sliding window tracking.
  - Automatic garbage collection to clean up expired IP windows and prevent memory leaks.
  - Global API rate limit: `80 requests / 1 minute` per IP.
  - Authentication endpoints limit: `30 requests / 1 minute` per IP.
  - Injects standard HTTP headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, `Retry-After`).
  - Returns `429 Too Many Requests` when limits are exceeded.
- **Authentication System**:
  - `POST /api/auth/register` - Create a new user account with profile details.
  - `POST /api/auth/login` - Authenticate an existing user.
  - `GET /api/auth/me` - Fetch authenticated user details.
  - `POST /api/auth/logout` - Clear active user session.
- **Posts Management**:
  - `GET /api/posts` - Retrieve public post feeds (filters out archived posts by default).
  - `GET /api/posts?archived=true` - Retrieve user's private archived posts (only accessible to the logged-in owner).
  - `GET /api/posts/:id` - Fetch details for a specific post.
  - `POST /api/posts` - Create a new post.
  - `PUT /api/posts/:id` - Edit post title, body, or image URL (author only).
  - `POST /api/posts/:id/archive` - Archive or unarchive a post (author only).
  - `DELETE /api/posts/:id` - Delete a post and its associated comments (author only).
  - `POST /api/posts/:id/like` - Toggle like status on a post.
  - `POST /api/posts/:id/save` - Toggle saved status on a post.
- **Comments System**:
  - `GET /api/posts/:postId/comments` - Retrieve comments for a post.
  - `POST /api/posts/:postId/comments` - Add a new comment to a post.
- **User Management**:
  - `GET /api/users` - List all user profiles.
  - `GET /api/users/:id` - Get user profile by ID.
  - `PUT /api/users/:id` - Update user profile information.
  - `DELETE /api/users/:id` - Remove a user profile.
- **Photo Upload System (Storage-Optimized)**:
  - `POST /api/users/:id/photo` - Upload and update user profile avatar.
  - `POST /api/posts/:id/photo` - Upload and update post image.
  - Dedicated external storage directory: `uploads/users/` and `uploads/posts/`.
  - **Deterministic ID-Based Overwriting**: Uploads for the same user or post overwrite any previous photo for that ID, preventing orphaned files and saving VPS disk space.
  - Built-in static file serving at `/uploads/*`.
  - Beginner-friendly multipart handling: accepts field names `photo`, `image`, `avatar`, or `file`.
  - Robust image validation (JPG, PNG, GIF, WEBP, SVG up to 5MB) with clear JSON error feedback.

---

## Photo Upload & Storage Architecture

### 1. Directory Structure

Uploaded assets are stored outside of source files in a dedicated `uploads` directory:

```text
social-app-api-server/
├── uploads/
│   ├── users/
│   │   ├── user-1.jpg
│   │   └── user-2.png
│   └── posts/
│       ├── post-1.jpg
│       └── post-2.webp
```

### 2. ID-Based Overwriting Strategy

To prevent disk saturation when running in containerized or VPS environments with limited storage:
- User profile avatars are saved as `user-<userId>.<ext>`.
- Post images are saved as `post-<postId>.<ext>`.
- Whenever a new photo is uploaded for the same ID, any existing image file matching `<prefix>-<id>.*` in that directory is automatically removed before writing the new image.
- This ensures **zero orphaned files** even if the file extension changes (e.g. replacing a `.png` with a `.jpg`).

### 3. Static File Access

Uploaded files are served statically by Express:
- URL Pattern: `http://<server-address>:5000/uploads/users/user-<id>.<ext>`
- URL Pattern: `http://<server-address>:5000/uploads/posts/post-<id>.<ext>`
- Both relative URLs (`/uploads/...`) and full URLs (`http://.../uploads/...`) are returned in the upload responses for flexibility in frontend consumption.

### 4. Beginner-Friendly Upload Parsing

Beginners testing with tools like Postman, Thunder Client, or cURL often encounter errors when the form field name doesn't match the server's expectation. The upload middleware automatically accepts any of the following multipart form field keys:
- `photo`
- `image`
- `avatar`
- `file`

---

## Rate Limiting Architecture

| Limiter Scope | Target Endpoints | Window Duration | Max Requests | Exceedance Response |
| :--- | :--- | :--- | :--- | :--- |
| **Global Limiter** | `/api/*` | 1 minute (60,000 ms) | 80 requests / IP | `429 Too Many Requests` |
| **Auth Limiter** | `/api/auth/login`, `/api/auth/register` | 1 minute (60,000 ms) | 30 requests / IP | `429 Too Many Requests` |

### HTTP Headers Returned:
- `RateLimit-Limit` / `X-RateLimit-Limit`: Maximum requests allowed per window.
- `RateLimit-Remaining` / `X-RateLimit-Remaining`: Remaining requests in current window.
- `RateLimit-Reset` / `X-RateLimit-Reset`: UNIX epoch timestamp (seconds) when window resets.
- `Retry-After`: Seconds client must wait before retrying (included on HTTP 429 response).

---

## Post Archiving & Security Rules

1. **Owner-Only Modifications**:
   - Only the post creator (`post.userId === CURRENT_USER_ID`) can perform `PUT /api/posts/:id` (Edit), `POST /api/posts/:id/archive` (Archive), and `DELETE /api/posts/:id` (Delete).
   - Attempts by unauthorized users will return `403 Forbidden`.
2. **Private Archive Visibility**:
   - Archived posts (`isArchived: true`) are strictly hidden from general post feeds (`GET /api/posts`).
   - Querying `GET /api/posts?archived=true` will only return the archived posts belonging to the requesting logged-in user.
   - Accessing `GET /api/posts/:id` directly for an archived post by anyone other than the author will yield `403 Forbidden`.

---

## Tech Stack & Architecture

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js (v5)
- **File Upload**: Multer (v2) with custom disk storage and ID overwrite logic
- **Middleware**: CORS, JSON Body Parser, Custom In-Memory Rate Limiter, Static File Serving

---

## Prerequisites

- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- **Docker** (Optional, for containerized deployment on VPS)

---

## Environment Setup & Configuration

- **Default Port**: `5000` (Configured via `PORT` environment variable or defaults to 5000 in `server.js`)
- **CORS**: Enabled by default for all cross-origin requests.
- **Upload Directory**: Created automatically at `./uploads/users` and `./uploads/posts` if not present.

---

## Step-by-Step Guide

### Running Locally (Development)

1. Clone or navigate to the server repository directory:
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

### Running with Docker (Production / Containerized on VPS)

1. Build the Docker container image:
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

   > **Why use `-v $(pwd)/uploads:/usr/src/app/uploads` on VPS?**
   > By default, container file systems are ephemeral. Binding the host's `uploads` directory to `/usr/src/app/uploads` inside the container guarantees that uploaded photos are permanently persisted across container restarts, updates, and rebuilds on your VPS.

3. Verify container status:
   ```bash
   docker ps
   docker logs -f social-app-api-container
   ```

### Re-deploying on VPS (Updating an Existing Container)

When updating your code, `Dockerfile`, or dependencies (like `multer`):

1. **Pull the latest changes on your VPS**:
   ```bash
   cd /path/to/social-app-api-server
   git pull origin main
   ```

2. **Re-build the Docker image with no cache to ensure fresh dependencies**:
   ```bash
   docker build -t social-app-api .
   ```

3. **Gracefully stop and remove the old running container**:
   ```bash
   docker stop social-app-api-container
   docker rm social-app-api-container
   ```
   *(Don't worry: your uploaded photos remain safe on the VPS host in `./uploads`!)*

4. **Start the new container with the persistent uploads volume**:
   ```bash
   docker run -d \
     --name social-app-api-container \
     -p 5000:5000 \
     -v $(pwd)/uploads:/usr/src/app/uploads \
     --restart unless-stopped \
     social-app-api
   ```

5. **Verify live server logs**:
   ```bash
   docker logs -f --tail 50 social-app-api-container
   ```

6. **(Optional) Clean up dangling Docker images to free up VPS disk space**:
   ```bash
   docker image prune -f
   ```

### Deploying via Git Container Registry (GitHub Packages / GHCR / GitLab Registry)

If you build the Docker image and host it on a Git container registry (such as GitHub Container Registry `ghcr.io` or GitLab Registry `registry.gitlab.com`), follow this streamlined deployment workflow:

#### 1. Build and Push from Local / CI:
```bash
# Define your registry image tag (e.g. GitHub Container Registry)
IMAGE_NAME="ghcr.io/<YOUR_GITHUB_USERNAME>/social-app-api:latest"

# Build image locally
docker build -t $IMAGE_NAME .

# Login to Git image host (if not already logged in)
echo $GITHUB_TOKEN | docker login ghcr.io -u <YOUR_GITHUB_USERNAME> --password-stdin

# Push image to the Git registry
docker push $IMAGE_NAME
```

#### 2. Pull and Deploy on VPS:
Connect to your VPS via SSH and run:
```bash
IMAGE_NAME="ghcr.io/<YOUR_GITHUB_USERNAME>/social-app-api:latest"

# 1. Pull the new image from Git registry host
docker pull $IMAGE_NAME

# 2. Ensure host uploads folder exists for persistence
mkdir -p uploads/users uploads/posts

# 3. Stop and remove the old running container
docker stop social-app-api-container || true
docker rm social-app-api-container || true

# 4. Run the updated container with volume bind-mount for uploads
docker run -d \
  --name social-app-api-container \
  -p 5000:5000 \
  -v $(pwd)/uploads:/usr/src/app/uploads \
  --restart unless-stopped \
  $IMAGE_NAME

# 5. Clean up old untagged images to conserve VPS disk storage
docker image prune -f
```

---

## Complete API Reference

### Authentication Endpoints

| Method | Endpoint | Authorization | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | 30 / 1 min | Register new user account |
| `POST` | `/api/auth/login` | Public | 30 / 1 min | Log in user account |
| `GET` | `/api/auth/me` | Authenticated | 80 / 1 min | Fetch authenticated user info |
| `POST` | `/api/auth/logout` | Authenticated | 80 / 1 min | Log out active user session |

### Posts Endpoints

| Method | Endpoint | Authorization | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | Public | 80 / 1 min | List all active posts (supports `?userId=X`) |
| `GET` | `/api/posts?archived=true` | Authenticated | 80 / 1 min | List current user's archived posts |
| `GET` | `/api/posts/:id` | Public / Author | 80 / 1 min | Get post details (403 if archived by another user) |
| `POST` | `/api/posts` | Authenticated | 80 / 1 min | Create a new post (`{ "title": "...", "body": "..." }`) |
| `PUT` | `/api/posts/:id` | Author Only | 80 / 1 min | Update post details (`{ "title": "...", "body": "..." }`) |
| `POST` | `/api/posts/:id/archive` | Author Only | 80 / 1 min | Toggle or set post archive status |
| `DELETE` | `/api/posts/:id` | Author Only | 80 / 1 min | Delete post and associated comments |
| `POST` | `/api/posts/:id/like` | Public | 80 / 1 min | Toggle post like status |
| `POST` | `/api/posts/:id/save` | Public | 80 / 1 min | Toggle post save status |

### Photo Upload Endpoints

| Method | Endpoint | Aliases | Form Field Names | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/users/:id/photo` | `/api/users/:id/avatar`, `/api/upload/user/:id` | `photo`, `image`, `avatar`, `file` | Upload and set profile avatar for user `:id` (overwrites previous) |
| `POST` | `/api/posts/:id/photo` | `/api/posts/:id/image`, `/api/upload/post/:id` | `photo`, `image`, `file` | Upload and set photo for post `:id` (overwrites previous) |

### Comments Endpoints

| Method | Endpoint | Authorization | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/posts/:postId/comments` | Public | 80 / 1 min | List comments for a post |
| `POST` | `/api/posts/:postId/comments` | Public | 80 / 1 min | Create comment on post (`{ "body": "..." }`) |

### Users Endpoints

| Method | Endpoint | Authorization | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/users` | Public | 80 / 1 min | List all users |
| `GET` | `/api/users/:id` | Public | 80 / 1 min | Get user profile by ID |
| `PUT` | `/api/users/:id` | Public | 80 / 1 min | Update user profile |
| `DELETE` | `/api/users/:id` | Public | 80 / 1 min | Delete user profile |

---

## Beginner Testing Guide (cURL & Postman)

### 1. Upload User Profile Photo

Using **cURL**:
```bash
curl -X POST http://localhost:5000/api/users/1/photo \
  -F "photo=@/path/to/profile.jpg"
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
    "avatarUrl": "/uploads/users/user-1.jpg",
    "updatedAt": "2026-09-03T15:30:00.000Z"
  }
}
```

In **Postman**:
1. Select method **POST** and enter `http://localhost:5000/api/users/1/photo`.
2. Navigate to the **Body** tab and choose **form-data**.
3. In the KEY column, type `photo` (or `avatar` or `image`) and change the dropdown from *Text* to *File*.
4. In the VALUE column, select your image file.
5. Click **Send**.

### 2. Upload Post Photo

Using **cURL**:
```bash
curl -X POST http://localhost:5000/api/posts/1/photo \
  -F "photo=@/path/to/post_image.png"
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
    "title": "Getting Started with React",
    "imageUrl": "/uploads/posts/post-1.png",
    "updatedAt": "2026-09-03T15:30:00.000Z"
  }
}
```

### 3. Verify Automatic Overwriting

1. Upload `avatar.jpg` for user 1. Check directory `uploads/users/` — `user-1.jpg` exists.
2. Upload `avatar.png` for user 1. Check directory `uploads/users/` — `user-1.jpg` is removed and replaced with `user-1.png`.
3. Storage remains clean with only one image per user/post.
