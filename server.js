import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import formRoutes from "./routes/formRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Setup external uploads storage directories
const UPLOADS_DIR = path.join(__dirname, "uploads");
const USERS_UPLOAD_DIR = path.join(UPLOADS_DIR, "users");
const POSTS_UPLOAD_DIR = path.join(UPLOADS_DIR, "posts");

[UPLOADS_DIR, USERS_UPLOAD_DIR, POSTS_UPLOAD_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded files
app.use("/uploads", express.static(UPLOADS_DIR));

// ==========================================
// Rate Limiting Middleware
// ==========================================
function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000;
  const max = options.max || 100;
  const message = options.message || {
    error: "Too many requests, please try again later.",
  };

  const requests = new Map();

  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests.entries()) {
      if (now > record.resetTime) {
        requests.delete(key);
      }
    }
  }, 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const key =
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress ||
      "unknown";

    const now = Date.now();
    let record = requests.get(key);

    if (!record || now > record.resetTime) {
      record = {
        hits: 1,
        resetTime: now + windowMs,
      };
    } else {
      record.hits += 1;
    }

    requests.set(key, record);

    const remaining = Math.max(0, max - record.hits);
    const resetTimeSec = Math.ceil(record.resetTime / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetTimeSec);
    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetTimeSec);

    if (record.hits > max) {
      const retryAfterSec = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader("Retry-After", retryAfterSec);
      return res.status(429).json(message);
    }

    next();
  };
}

const globalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 80,
  message: { error: "Too many requests from this IP, please try again later." },
});

const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: {
    error: "Too many login/registration attempts, please try again later.",
  },
});

app.use("/api/", globalRateLimiter);
app.use("/api/auth/login", authRateLimiter);
app.use("/api/auth/register", authRateLimiter);

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
    imageUrl:
      "https://unsplash.com/photos/4hbJ-eymZ1o/download?force=true&w=640",
    likes: [2, 3, 4, 5],
    likesCount: 4,
    savedBy: [2],
    isSaved: false,
    isArchived: false,
    createdAt: "2026-08-20T10:00:00.000Z",
    updatedAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: 2,
    userId: 2,
    title: "Understanding useState Hook",
    body: "The useState hook lets you add state to functional components.",
    imageUrl:
      "https://unsplash.com/photos/m_HRfLhgABo/download?force=true&w=640",
    likes: [1, 3, 4],
    likesCount: 3,
    savedBy: [1, 3],
    isSaved: true,
    isArchived: false,
    createdAt: "2026-08-21T09:30:00.000Z",
    updatedAt: "2026-08-21T09:30:00.000Z",
  },
  {
    id: 3,
    userId: 3,
    title: "Props and Component Communication",
    body: "Props are the way components talk to each other in React. A parent component can pass data down to its children through props.",
    imageUrl:
      "https://unsplash.com/photos/9WnjxT1NCoY/download?force=true&w=640",
    likes: [1, 2, 4, 6],
    likesCount: 4,
    savedBy: [2],
    isSaved: false,
    isArchived: false,
    createdAt: "2026-08-22T14:15:00.000Z",
    updatedAt: "2026-08-22T14:15:00.000Z",
  },
  {
    id: 4,
    userId: 4,
    title: "React Router for Navigation",
    body: "React Router lets you handle navigation in a single page application with seamless client-side routing.",
    imageUrl:
      "https://unsplash.com/photos/vpOeXr5wmR4/download?force=true&w=640",
    likes: [1, 2, 3, 5],
    likesCount: 4,
    savedBy: [1, 5],
    isSaved: false,
    isArchived: false,
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
    isArchived: Boolean(post.isArchived),
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
    avatarUrl: avatarUrl || `https://i.pravatar.cc/150?u=${rawUsername}`,
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
  const currentUserId = CURRENT_USER_ID;
  const requestedUserId = req.query.userId ? Number(req.query.userId) : null;
  const isArchivedQuery =
    req.query.archived === "true" ||
    req.query.isArchived === "true" ||
    req.query.includeArchived === "true";

  let filtered = posts;

  // Filter by userId if provided in query params
  if (requestedUserId) {
    filtered = filtered.filter((p) => Number(p.userId) === requestedUserId);
  }

  // Handle archive visibility rules:
  // - If archived query is explicitly requested, ONLY return archived posts belonging to current logged-in user.
  // - If archived query is omitted/false, exclude all archived posts.
  if (isArchivedQuery) {
    filtered = filtered.filter(
      (p) =>
        Boolean(p.isArchived) && Number(p.userId) === Number(currentUserId),
    );
  } else {
    filtered = filtered.filter((p) => !p.isArchived);
  }

  const userIdForFormat = requestedUserId || currentUserId;
  const formattedPosts = filtered.map((p) => formatPost(p, userIdForFormat));
  return res.json(formattedPosts);
});

// GET /api/posts/:id
app.get("/api/posts/:id", (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found" });

  if (post.isArchived && Number(post.userId) !== Number(CURRENT_USER_ID)) {
    return res
      .status(403)
      .json({ error: "Archived post can only be viewed by its author" });
  }

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
    imageUrl: imageUrl || `https://picsum.photos/seed/${Date.now()}/600/350`,
    likes: [],
    likesCount: 0,
    savedBy: [],
    isSaved: false,
    isArchived: false,
    createdAt: now,
    updatedAt: now,
  };

  posts.unshift(newPost);
  return res.status(201).json(formatPost(newPost, CURRENT_USER_ID));
});

// PUT /api/posts/:id (Edit Post)
app.put("/api/posts/:id", (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found" });

  const currentUserId = CURRENT_USER_ID || 1;
  if (Number(post.userId) !== Number(currentUserId)) {
    return res
      .status(403)
      .json({ error: "Unauthorized: You can only edit your own posts" });
  }

  const { title, body, imageUrl, isArchived } = req.body;
  if (title !== undefined) post.title = title;
  if (body !== undefined) post.body = body;
  if (imageUrl !== undefined) post.imageUrl = imageUrl;
  if (isArchived !== undefined) post.isArchived = Boolean(isArchived);

  post.updatedAt = new Date().toISOString();
  return res.json(formatPost(post, currentUserId));
});

// POST /api/posts/:id/archive (Archive / Unarchive Post)
app.post("/api/posts/:id/archive", (req, res) => {
  const post = posts.find((p) => p.id === Number(req.params.id));
  if (!post) return res.status(404).json({ error: "Post not found" });

  const currentUserId = CURRENT_USER_ID || 1;
  if (Number(post.userId) !== Number(currentUserId)) {
    return res
      .status(403)
      .json({ error: "Unauthorized: You can only archive your own posts" });
  }

  if (req.body && req.body.isArchived !== undefined) {
    post.isArchived = Boolean(req.body.isArchived);
  } else {
    post.isArchived = !post.isArchived;
  }

  post.updatedAt = new Date().toISOString();
  return res.json(formatPost(post, currentUserId));
});

// DELETE /api/posts/:id (Delete Post)
app.delete("/api/posts/:id", (req, res) => {
  const postIndex = posts.findIndex((p) => p.id === Number(req.params.id));
  if (postIndex === -1)
    return res.status(404).json({ error: "Post not found" });

  const post = posts[postIndex];
  const currentUserId = CURRENT_USER_ID || 1;
  if (Number(post.userId) !== Number(currentUserId)) {
    return res
      .status(403)
      .json({ error: "Unauthorized: You can only delete your own posts" });
  }

  const [deletedPost] = posts.splice(postIndex, 1);
  comments = comments.filter((c) => c.postId !== deletedPost.id);

  return res.json({
    success: true,
    deletedPostId: deletedPost.id,
    deletedPost: formatPost(deletedPost, currentUserId),
  });
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
// 6. Photo Upload System (Multer & Overwrite by ID)
// ==========================================

/**
 * Remove any existing files matching prefix and id in the target directory
 * so that each post or user profile has exactly one image file, overwriting
 * previous uploads to save disk storage on the container / VPS.
 */
function removeExistingFiles(directory, prefix, id) {
  try {
    if (!fs.existsSync(directory)) return;
    const files = fs.readdirSync(directory);
    const targetPattern = new RegExp(`^${prefix}-${id}\\.[a-zA-Z0-9]+$`, "i");
    for (const file of files) {
      if (targetPattern.test(file)) {
        fs.unlinkSync(path.join(directory, file));
      }
    }
  } catch (err) {
    console.error(`Failed to remove existing file for ${prefix}-${id}:`, err);
  }
}

// Supported image MIME types
const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const imageFileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_MIMES.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    const err = new Error(
      "Invalid file type. Only image files (JPG, PNG, GIF, WEBP, SVG) are allowed.",
    );
    err.code = "INVALID_IMAGE_TYPE";
    cb(err, false);
  }
};

// Storage engine for user profile pictures
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, USERS_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const userId = req.params.id;
    // Clean up any existing image with this user's ID to reduce disk usage
    removeExistingFiles(USERS_UPLOAD_DIR, "user", userId);
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `user-${userId}${ext}`);
  },
});

// Storage engine for post photos
const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, POSTS_UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const postId = req.params.id;
    // Clean up any existing image with this post's ID to reduce disk usage
    removeExistingFiles(POSTS_UPLOAD_DIR, "post", postId);
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    cb(null, `post-${postId}${ext}`);
  },
});

const uploadUserMulter = multer({
  storage: userStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max limit
  fileFilter: imageFileFilter,
});

const uploadPostMulter = multer({
  storage: postStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max limit
  fileFilter: imageFileFilter,
});

/**
 * Flexible wrapper accepting common field names ('photo', 'image', 'avatar', 'file')
 * and providing beginner-friendly JSON error messages.
 */
function createUploadMiddleware(multerInstance) {
  const uploadFields = multerInstance.fields([
    { name: "photo", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
    { name: "file", maxCount: 1 },
  ]);

  return (req, res, next) => {
    uploadFields(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            error: "File is too large. Maximum allowed size is 5MB.",
          });
        }
        if (err.code === "INVALID_IMAGE_TYPE") {
          return res.status(400).json({ error: err.message });
        }
        return res
          .status(400)
          .json({ error: err.message || "File upload failed" });
      }

      if (req.files) {
        req.file =
          req.files.photo?.[0] ||
          req.files.image?.[0] ||
          req.files.avatar?.[0] ||
          req.files.file?.[0];
      }

      if (!req.file) {
        return res.status(400).json({
          error:
            "No image file uploaded. Please send a file with field name 'photo', 'image', 'avatar', or 'file'.",
        });
      }

      next();
    });
  };
}

const handleUserUpload = createUploadMiddleware(uploadUserMulter);
const handlePostUpload = createUploadMiddleware(uploadPostMulter);

// Validation middlewares ensuring entity exists before upload processing
const validateUserForUpload = (req, res, next) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  req.targetUser = user;
  next();
};

const validatePostForUpload = (req, res, next) => {
  const postId = Number(req.params.id);
  if (isNaN(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  const post = posts.find((p) => p.id === postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }
  req.targetPost = post;
  next();
};

// Route handlers
const userPhotoUploadHandler = (req, res) => {
  const user = req.targetUser;
  const relativeUrl = `/uploads/users/${req.file.filename}`;
  const fullUrl = `${req.protocol}://${req.get("host")}${relativeUrl}`;

  user.avatarUrl = relativeUrl;
  user.updatedAt = new Date().toISOString();

  return res.json({
    message: "User profile photo uploaded successfully",
    avatarUrl: relativeUrl,
    fullUrl,
    filename: req.file.filename,
    size: req.file.size,
    user: sanitizeUser(user),
  });
};

const postPhotoUploadHandler = (req, res) => {
  const post = req.targetPost;
  const relativeUrl = `/uploads/posts/${req.file.filename}`;
  const fullUrl = `${req.protocol}://${req.get("host")}${relativeUrl}`;

  post.imageUrl = relativeUrl;
  post.updatedAt = new Date().toISOString();

  return res.json({
    message: "Post photo uploaded successfully",
    imageUrl: relativeUrl,
    fullUrl,
    filename: req.file.filename,
    size: req.file.size,
    post: formatPost(post, CURRENT_USER_ID),
  });
};

// User photo upload routes
app.post(
  "/api/users/:id/photo",
  validateUserForUpload,
  handleUserUpload,
  userPhotoUploadHandler,
);
app.post(
  "/api/users/:id/avatar",
  validateUserForUpload,
  handleUserUpload,
  userPhotoUploadHandler,
);
app.post(
  "/api/upload/user/:id",
  validateUserForUpload,
  handleUserUpload,
  userPhotoUploadHandler,
);

// Post photo upload routes
app.post(
  "/api/posts/:id/photo",
  validatePostForUpload,
  handlePostUpload,
  postPhotoUploadHandler,
);
app.post(
  "/api/posts/:id/image",
  validatePostForUpload,
  handlePostUpload,
  postPhotoUploadHandler,
);
app.post(
  "/api/upload/post/:id",
  validatePostForUpload,
  handlePostUpload,
  postPhotoUploadHandler,
);

// ==========================================
// 7. Form Testing Submission Routes
// ==========================================
app.use("/api", formRoutes);

// ==========================================
// Start Server
// ==========================================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
