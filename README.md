# Social App API Server

This is a modular, high-performance Node.js Express API server for the Social Application. It features an in-memory database management system to handle users, authentication, posts (with edit, delete, and private archiving capabilities), and post comments.

---

## Features

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
- **Middleware**: CORS, JSON Body Parser

---

## Prerequisites

- **Node.js** (v18+ recommended)
- **npm** (v9+ recommended)
- **Docker** (Optional, for containerized execution)

---

## Environment Setup & Configuration

- **Default Port**: `5000` (Configured in `server.js`)
- **CORS**: Enabled by default for all cross-origin requests.

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

### Running with Docker (Production / Containerized)

1. Build the Docker container image:

   ```bash
   docker build -t social-app-api .
   ```

2. Spin up the container on port 5000:

   ```bash
   docker run -p 5000:5000 social-app-api
   ```

3. Access the containerized server at `http://localhost:5000`.

---

## Complete API Reference

### Authentication Endpoints

| Method | Endpoint             | Description       | Payload Example                                                      |
| :----- | :------------------- | :---------------- | :------------------------------------------------------------------- |
| `POST` | `/api/auth/register` | Register new user | `{ "name": "User", "email": "user@example.com", "password": "123" }` |
| `POST` | `/api/auth/login`    | Log in user       | `{ "email": "user@example.com", "password": "123" }`                 |
| `GET`  | `/api/auth/me`       | Current user info | Header / Cookie session state                                        |
| `POST` | `/api/auth/logout`   | Log out user      | N/A                                                                  |

### Posts Endpoints

| Method   | Endpoint                   | Authorization   | Description                                               |
| :------- | :------------------------- | :-------------- | :-------------------------------------------------------- |
| `GET`    | `/api/posts`               | Public          | List all active posts (supports `?userId=X`)              |
| `GET`    | `/api/posts?archived=true` | Authenticated   | List current user's archived posts                        |
| `GET`    | `/api/posts/:id`           | Public / Author | Get post details (403 if archived by another user)        |
| `POST`   | `/api/posts`               | Authenticated   | Create a new post (`{ "title": "...", "body": "..." }`)   |
| `PUT`    | `/api/posts/:id`           | Author Only     | Update post details (`{ "title": "...", "body": "..." }`) |
| `POST`   | `/api/posts/:id/archive`   | Author Only     | Toggle or set post archive status                         |
| `DELETE` | `/api/posts/:id`           | Author Only     | Delete post and associated comments                       |
| `POST`   | `/api/posts/:id/like`      | Public          | Toggle post like status                                   |
| `POST`   | `/api/posts/:id/save`      | Public          | Toggle post save status                                   |

### Comments Endpoints

| Method | Endpoint                      | Description                                          |
| :----- | :---------------------------- | :--------------------------------------------------- |
| `GET`  | `/api/posts/:postId/comments` | List comments for a post                             |
| `POST` | `/api/posts/:postId/comments` | Create comment on post (`{ "body": "Great post!" }`) |

### Users Endpoints

| Method   | Endpoint         | Description            |
| :------- | :--------------- | :--------------------- |
| `GET`    | `/api/users`     | List all users         |
| `GET`    | `/api/users/:id` | Get user profile by ID |
| `PUT`    | `/api/users/:id` | Update user profile    |
| `DELETE` | `/api/users/:id` | Delete user profile    |
