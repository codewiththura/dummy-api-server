import multer from "multer";

export const ALLOWED_IMAGE_MIMES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Filter ensuring only supported image MIME types are accepted.
 */
export const imageFileFilter = (req, file, cb) => {
  const mime = (file.mimetype || "").toLowerCase();
  if (ALLOWED_IMAGE_MIMES.includes(mime)) {
    cb(null, true);
  } else {
    const err = new Error(
      "Invalid file type. Only image files (JPG, PNG, GIF, WEBP, SVG) are allowed.",
    );
    err.code = "INVALID_IMAGE_TYPE";
    cb(err, false);
  }
};

/**
 * In-memory Multer engine.
 * Stores files in memory as Buffers, keeping zero persistent files on server disk.
 */
export const memoryUploadMulter = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: imageFileFilter,
});

/**
 * Higher-order middleware accepting common field names ('photo', 'image', 'avatar', 'file')
 * and normalizing errors into clear, beginner-friendly JSON responses.
 */
export function createImageUploadMiddleware(multerInstance = memoryUploadMulter) {
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

export const handleImageUpload = createImageUploadMiddleware(memoryUploadMulter);
