import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. In-Memory Database
// ==========================================

let CURRENT_USER_ID = null;

let users = [
  {
    id: 1,
    name: "Thura",
    username: "thura",
    email: "thura@example.com",
    password: "password123",
    avatarUrl: "https://i.pravatar.cc/150?img=68",
    bio: "Passionate React & Node.js Developer.",
    createdAt: "2026-08-01T08:00:00.000Z",
    updatedAt: "2026-08-01T08:00:00.000Z",
  },
  {
    id: 2,
    name: "May Thin",
    username: "maythin",
    email: "maythin@example.com",
    password: "password123",
    avatarUrl: "https://i.pravatar.cc/150?u=maythin",
    bio: "Frontend UI/UX enthusiast and technical writer.",
    createdAt: "2026-08-02T09:00:00.000Z",
    updatedAt: "2026-08-02T09:00:00.000Z",
  },
  {
    id: 3,
    name: "Zaw Min",
    username: "zawmin",
    email: "zawmin@example.com",
    password: "password123",
    avatarUrl: "https://i.pravatar.cc/150?u=zawmin",
    bio: "Fullstack engineer passionate about clean architecture.",
    createdAt: "2026-08-03T10:00:00.000Z",
    updatedAt: "2026-08-03T10:00:00.000Z",
  },
  {
    id: 4,
    name: "Hla Hla",
    username: "hlahla",
    email: "hlahla@example.com",
    password: "password123",
    avatarUrl: "https://i.pravatar.cc/150?u=hlahla",
    bio: "Mobile and Single Page Application enthusiast.",
    createdAt: "2026-08-04T11:00:00.000Z",
    updatedAt: "2026-08-04T11:00:00.000Z",
  },
  {
    id: 5,
    name: "Kyaw Thu",
    username: "kyawthu",
    email: "kyawthu@example.com",
    password: "password123",
    avatarUrl: "https://i.pravatar.cc/150?u=kyawthu",
    bio: "Software Architect & Tech Instructor.",
    createdAt: "2026-08-05T12:00:00.000Z",
    updatedAt: "2026-08-05T12:00:00.000Z",
  },
  {
    id: 6,
    name: "Su Su",
    username: "susu",
    email: "susu@example.com",
    password: "password123",
    avatarUrl: "https://i.pravatar.cc/150?u=susu",
    bio: "React and Next.js Frontend Developer.",
    createdAt: "2026-08-06T13:00:00.000Z",
    updatedAt: "2026-08-06T13:00:00.000Z",
  },
];

let posts = [
  {
    id: 1,
    userId: 1,
    title: "Getting Started with React",
    body: "React is a JavaScript library for building user interfaces.",
    imageUrl: "https://picsum.photos/seed/react-intro/600/350",
    likes: [2, 3, 4, 5],
    likesCount: 4,
    savedBy: [2],
    isSaved: false,
    createdAt: "2026-08-20T10:00:00.000Z",
    updatedAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: 2,
    userId: 2,
    title: "Understanding useState Hook",
    body: "The useState hook lets you add state to functional components.",
    imageUrl: "https://picsum.photos/seed/usestate-hook/600/350",
    likes: [1, 3, 4],
    likesCount: 3,
    savedBy: [1, 3],
    isSaved: true,
    createdAt: "2026-08-21T09:30:00.000Z",
    updatedAt: "2026-08-21T09:30:00.000Z",
  },
  {
    id: 3,
    userId: 3,
    title: "Props and Component Communication",
    body: "Props are the way components talk to each other in React. A parent component can pass data down to its children through props.",
    imageUrl: "https://picsum.photos/seed/props-react/600/350",
    likes: [1, 2, 4, 6],
    likesCount: 4,
    savedBy: [2],
    isSaved: false,
    createdAt: "2026-08-22T14:15:00.000Z",
    updatedAt: "2026-08-22T14:15:00.000Z",
  },
  {
    id: 4,
    userId: 4,
    title: "React Router for Navigation",
    body: "React Router lets you handle navigation in a single page application with seamless client-side routing.",
    imageUrl: "https://picsum.photos/seed/react-router/600/350",
    likes: [1, 2, 3, 5],
    likesCount: 4,
    savedBy: [1, 5],
    isSaved: false,
    createdAt: "2026-08-23T11:45:00.000Z",
    updatedAt: "2026-08-23T11:45:00.000Z",
  },
];

let comments = [
  {
    id: 101,
    postId: 1,
    userId: 2,
    name: "May Thin",
    email: "maythin@example.com",
    body: "This is a great introduction to React! Very helpful for beginners.",
    createdAt: "2026-08-20T11:00:00.000Z",
  },
  {
    id: 102,
    postId: 1,
    userId: 3,
    name: "Zaw Min",
    email: "zawmin@example.com",
    body: "I learned a lot from this post. Thanks for sharing!",
    createdAt: "2026-08-20T12:30:00.000Z",
  },
];

// Helper Functions
function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function formatPost(post, currentUserId = CURRENT_USER_ID) {
  const authorUser = users.find((u) => u.id === Number(post.userId));
  const likesList = Array.isArray(post.likes) ? post.likes : [];
  const savedList = Array.isArray(post.savedBy) ? post.savedBy : [];

  return {
    ...post,
    userId: post.userId,
    author: authorUser
      ? {
          id: authorUser.id,
          name: authorUser.name,
          username: authorUser.username,
          avatarUrl: authorUser.avatarUrl,
        }
      : { id: post.userId || 0, name: "Unknown Author" },
    likes: likesList,
    likesCount: likesList.length,
    isLiked: currentUserId ? likesList.includes(Number(currentUserId)) : false,
    savedBy: savedList,
    isSaved: currentUserId
      ? savedList.includes(Number(currentUserId)) || Boolean(post.isSaved)
      : false,
  };
}

// ==========================================
// 2. Auth Endpoints
// ==========================================

// POST /api/auth/register
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, username, bio, avatarUrl } = req.body;
  const normalizedEmail = (email || "").trim().toLowerCase();

  if (!normalizedEmail || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const exists = users.some((u) => u.email.toLowerCase() === normalizedEmail);
  if (exists) {
    return res.status(400).json({ error: "Email already registered" });
  }

  const rawUsername = (username || name || "user")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
  const now = new Date().toISOString();

  const newUser = {
    id: Date.now(),
    name: name || "New User",
    username: rawUsername,
    email: normalizedEmail,
    password,
    avatarUrl:
      avatarUrl ||
      `[https://i.pravatar.cc/150?u=$](https://i.pravatar.cc/150?u=$){rawUsername}`,
    bio: bio || "Hello, I am using Social App!",
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  CURRENT_USER_ID = newUser.id;
  return res.status(201).json(sanitizeUser(newUser));
});

// POST /api/auth/login
app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = (email || "").trim().toLowerCase();

  const user = users.find(
    (u) => u.email.toLowerCase() === normalizedEmail && u.password === password,
  );

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  CURRENT_USER_ID = user.id;
  return res.json(sanitizeUser(user));
});

// GET /api/auth/me
app.get("/api/auth/me", (req, res) => {
  if (!CURRENT_USER_ID) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const user = users.find((u) => u.id === CURRENT_USER_ID);
  return res.json(sanitizeUser(user));
});

// POST /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  CURRENT_USER_ID = null;
  return res.json({ success: true });
});

// ==========================================
// 3. Posts Endpoints
// ==========================================

// GET /api/posts
app.get("/api/posts", (req, res) => {
  const userId = req.query.userId ? Number(req.query.userId) : CURRENT_USER_ID;
  const formattedPosts = posts.map((p) => formatPost(p, userId));
  return res.json(formattedPosts);
});

// GET /api/posts/:id
app.get("/api/posts/:id", (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found" });
  return res.json(formatPost(post, CURRENT_USER_ID));
});

// POST /api/posts
app.post("/api/posts", (req, res) => {
  const { title, body, imageUrl } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const now = new Date().toISOString();
  const newPost = {
    id: Date.now(),
    userId: CURRENT_USER_ID || 1,
    title,
    body: body || "",
    imageUrl:
      imageUrl ||
      `[https://picsum.photos/seed/$](https://picsum.photos/seed/$){Date.now()}/600/350`,
    likes: [],
    likesCount: 0,
    savedBy: [],
    isSaved: false,
    createdAt: now,
    updatedAt: now,
  };

  posts.unshift(newPost);
  return res.status(201).json(formatPost(newPost, CURRENT_USER_ID));
});

// POST /api/posts/:id/like
app.post("/api/posts/:id/like", (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found" });

  const userId = Number(req.body.userId || CURRENT_USER_ID || 1);
  const likeIdx = post.likes.indexOf(userId);

  if (likeIdx > -1) {
    post.likes.splice(likeIdx, 1);
  } else {
    post.likes.push(userId);
  }

  post.likesCount = post.likes.length;
  post.updatedAt = new Date().toISOString();
  return res.json(formatPost(post, userId));
});

// POST /api/posts/:id/save
app.post("/api/posts/:id/save", (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found" });

  const userId = Number(req.body.userId || CURRENT_USER_ID || 1);
  const saveIdx = post.savedBy.indexOf(userId);

  if (saveIdx > -1) {
    post.savedBy.splice(saveIdx, 1);
    post.isSaved = false;
  } else {
    post.savedBy.push(userId);
    post.isSaved = true;
  }

  post.updatedAt = new Date().toISOString();
  return res.json(formatPost(post, userId));
});

// ==========================================
// 4. Comments Endpoints
// ==========================================

// GET /api/posts/:postId/comments
app.get("/api/posts/:postId/comments", (req, res) => {
  const postComments = comments.filter(
    (c) => c.postId === Number(req.params.postId),
  );
  return res.json(postComments);
});

// POST /api/posts/:postId/comments
app.post("/api/posts/:postId/comments", (req, res) => {
  const { body, name, email } = req.body;
  if (!body) return res.status(400).json({ error: "Comment body is required" });

  const userId = CURRENT_USER_ID || 1;
  const user = users.find((u) => u.id === userId);

  const newComment = {
    id: Date.now(),
    postId: Number(req.params.postId),
    userId,
    name: name || (user ? user.name : "Anonymous"),
    email: email || (user ? user.email : "user@example.com"),
    body,
    createdAt: new Date().toISOString(),
  };

  comments.push(newComment);
  return res.status(201).json(newComment);
});

// ==========================================
// 5. Users Endpoints
// ==========================================

// GET /api/users
app.get("/api/users", (req, res) => {
  return res.json(users.map(sanitizeUser));
});

// GET /api/users/:id
app.get("/api/users/:id", (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(sanitizeUser(user));
});

// PUT /api/users/:id
app.put("/api/users/:id", (req, res) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "User not found" });

  users[index] = {
    ...users[index],
    ...req.body,
    id: users[index].id,
    updatedAt: new Date().toISOString(),
  };

  return res.json(sanitizeUser(users[index]));
});

// DELETE /api/users/:id
app.delete("/api/users/:id", (req, res) => {
  const index = users.findIndex((u) => u.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ error: "User not found" });

  const [deletedUser] = users.splice(index, 1);
  return res.json({ success: true, deletedUser: sanitizeUser(deletedUser) });
});

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
