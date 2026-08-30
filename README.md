# Social App API Server

This is a simple Node.js Express API server for a social application. It uses an in-memory database to store users, posts, and comments.

## Features

- **Authentication**: Register, Login, Logout, and retrieve current user info.
- **Posts**: Create, read, like, and save posts.
- **Comments**: View and add comments to posts.
- **Users**: View, update, and delete user profiles.

## Technologies Used

- Node.js
- Express.js
- CORS

## Prerequisites

- [Docker](https://www.docker.com/get-started) (if running via Docker)
- [Node.js](https://nodejs.org/) (if running locally)

## Getting Started

### Running Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   node server.js
   ```

3. The server will be running on `http://localhost:5000`.

### Running with Docker

1. Build the Docker image:
   ```bash
   docker build -t social-app-api .
   ```

2. Run the Docker container:
   ```bash
   docker run -p 5000:5000 social-app-api
   ```

3. The server will be available at `http://localhost:5000`.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Log in a user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/logout` - Log out current user

### Posts
- `GET /api/posts` - Get all posts (can filter by `userId` query param)
- `GET /api/posts/:id` - Get a specific post by ID
- `POST /api/posts` - Create a new post
- `POST /api/posts/:id/like` - Like or unlike a post
- `POST /api/posts/:id/save` - Save or unsave a post

### Comments
- `GET /api/posts/:postId/comments` - Get comments for a specific post
- `POST /api/posts/:postId/comments` - Add a comment to a specific post

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get a specific user by ID
- `PUT /api/users/:id` - Update a user's profile
- `DELETE /api/users/:id` - Delete a user
