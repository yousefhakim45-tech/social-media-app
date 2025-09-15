import express from "express";
import cors from "cors";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import chalk from "chalk";
import winston from "winston";
import Fuse from "fuse.js";
import rateLimit from "express-rate-limit";
import cluster from "cluster";
import os from "os";

// Paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Config
const PORT = 4000;
const numCPUs = os.cpus().length;

// Logger config
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.printf(({ timestamp, level, message }) => {
      const color =
        level === "error" ? chalk.red :
        level === "warn" ? chalk.yellow :
        level === "info" ? chalk.green :
        chalk.cyan;
      return `${chalk.gray(timestamp)} ${color(level.toUpperCase())}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "server.log" }),
  ],
});

if (cluster.isMaster) {
  console.log(chalk.blue(`Master ${process.pid} is running...`));
  for (let i = 0; i < numCPUs; i++) cluster.fork();
  cluster.on("exit", (worker) => {
    console.log(chalk.red(`Worker ${worker.process.pid} died. Restarting...`));
    cluster.fork();
  });
} else {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Upload setup
  const uploadFolder = path.join(__dirname, "uploads");
  if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
    logger.info(`Created uploads folder at ${uploadFolder}`);
  }
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadFolder),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage });

  // DB Connection
  let db;
  async function connectDB() {
    try {
      db = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "testdb",
        charset: "utf8mb4",
        multipleStatements: true,
      });
      await db.query(`CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id);`);
      logger.info("MySQL connected and index ensured!");
    } catch (err) {
      logger.error(`MySQL Connection Failed: ${err.message}`);
      process.exit(1);
    }
  }

    // --- HTTP Logger middleware with response time ---
  app.use(async (req, res, next) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const end = process.hrtime.bigint();
      const ms = Number(end - start) / 1e6;
      const msg = `${req.method} ${req.originalUrl} → ${res.statusCode} [${ms.toFixed(2)}ms]`;
      if (res.statusCode >= 500) logger.error(msg);
      else if (res.statusCode >= 400) logger.warn(msg);
      else logger.info(msg);
    });
    next();
  });

  // Routes

  // Toggle reactions
  app.post("/api/posts/:postId/reactions", async (req, res) => {
    const { postId } = req.params;
    const { user_id, emoji } = req.body;
    if (!user_id || !emoji) return res.status(400).json({ error: "Missing user_id or emoji" });

    try {
      const [rows] = await db.query(
        "SELECT id FROM post_reactions WHERE post_id = ? AND user_id = ? AND emoji = ?",
        [postId, user_id, emoji]
      );
      if (rows.length > 0) {
        await db.query(
          "DELETE FROM post_reactions WHERE post_id = ? AND user_id = ? AND emoji = ?",
          [postId, user_id, emoji]
        );
      } else {
        await db.query(
          "INSERT INTO post_reactions (post_id, user_id, emoji) VALUES (?, ?, ?)",
          [postId, user_id, emoji]
        );
      }
      res.json({ success: true });
    } catch (err) {
      logger.error(`Reaction error: ${err.stack}`);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Get emoji counts
  app.get("/api/posts/:postId/reactions", async (req, res) => {
    try {
      const [rows] = await db.query(
        "SELECT emoji, COUNT(*) AS count FROM post_reactions WHERE post_id = ? GROUP BY emoji",
        [req.params.postId]
      );
      res.json(rows);
    } catch (err) {
      logger.error(`Get reactions error: ${err.stack}`);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Get posts with pagination
// Get posts with pagination
app.get("/api/posts", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const [results] = await db.query(`
      SELECT p.id, p.title, p.content, p.post_date,
        (
          SELECT GROUP_CONCAT(m.file_path ORDER BY m.id ASC)
          FROM post_media m WHERE m.post_id = p.id
        ) AS media
      FROM posts p
      ORDER BY p.post_date DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    res.json(results.map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      post_date: r.post_date,      // <-- ensure post_date is included
      media: r.media ? r.media.split(",") : []
    })));
  } catch (err) {
    logger.error(`Get posts error: ${err.stack}`);
    res.status(500).json({ message: err.message });
  }
});

  // Create post
  app.post("/api/posts", upload.array("files"), async (req, res) => {
    const { title, content, latitude = null, longitude = null } = req.body;
    if (!title || !content) return res.status(400).json({ message: "Title and content required" });

    try {
      const [result] = await db.query(
        "INSERT INTO posts (title, content, latitude, longitude) VALUES (?, ?, ?, ?)",
        [title, content, latitude, longitude]
      );

      if (req.files?.length > 0) {
        const values = req.files.map(file => [
          result.insertId,
          path.relative(uploadFolder, file.path)
        ]);
        await db.query("INSERT INTO post_media (post_id, file_path) VALUES ?", [values]);
      }
      res.json({ message: "Post created successfully" });
    } catch (err) {
      logger.error(`Create post error: ${err.stack}`);
      res.status(500).json({ message: err.message });
    }
  });

  // Update post
  app.put("/api/posts/:id", upload.array("files"), async (req, res) => {
    const { id } = req.params;
    const { title, content, latitude = null, longitude = null } = req.body;

    try {
      await db.query(
        "UPDATE posts SET title = ?, content = ?, latitude = ?, longitude = ? WHERE id = ?",
        [title, content, latitude, longitude, id]
      );

      if (req.files?.length > 0) {
        const [results] = await db.query("SELECT file_path FROM post_media WHERE post_id = ?", [id]);
        results.forEach(row => {
          const filePath = path.join(uploadFolder, row.file_path);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
        await db.query("DELETE FROM post_media WHERE post_id = ?", [id]);
        const values = req.files.map(file => [
          id,
          path.relative(uploadFolder, file.path)
        ]);
        await db.query("INSERT INTO post_media (post_id, file_path) VALUES ?", [values]);
      }
      res.json({ message: "Post updated successfully" });
    } catch (err) {
      logger.error(`Update post error: ${err.stack}`);
      res.status(500).json({ message: err.message });
    }
  });

  // Delete post
  app.delete("/api/posts/:id", async (req, res) => {
    try {
      const [results] = await db.query("SELECT file_path FROM post_media WHERE post_id = ?", [req.params.id]);
      results.forEach(row => {
        const filePath = path.join(uploadFolder, row.file_path);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            logger.info(`Deleted file: ${filePath}`);
          } catch (unlinkErr) {
            logger.error(`Error deleting file ${filePath}: ${unlinkErr.message}`);
          }
        }
      });
      await db.query("DELETE FROM post_media WHERE post_id = ?", [req.params.id]);
      await db.query("DELETE FROM posts WHERE id = ?", [req.params.id]);
      logger.info(`Post deleted: ${req.params.id}`);
      res.json({ message: "Post deleted successfully" });
    } catch (err) {
      logger.error(`Delete post error: ${err.stack}`);
      res.status(500).json({ message: err.message });
    }
  });

  // Geolocation search
  app.get("/api/posts/nearby", async (req, res) => {
    const { lat, lng, radius = 10 } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

    try {
      const earthRadius = 6371;
      const query = `
        SELECT p.*, (
          ${earthRadius} * 2 * ASIN(
            SQRT(
              POWER(SIN((? - ABS(latitude)) * PI() / 180 / 2), 2) +
              COS(? * PI() / 180) * COS(ABS(latitude) * PI() / 180) *
              POWER(SIN((? - longitude) * PI() / 180 / 2), 2)
            )
          )
        ) AS distance
        FROM posts p
        HAVING distance <= ?
        ORDER BY distance ASC
        LIMIT 50
      `;
      const [rows] = await db.query(query, [lat, lat, lng, radius]);
      res.json(rows);
    } catch (err) {
      logger.error(`Nearby search error: ${err.stack}`);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Search with Fuse.js
  app.get("/api/posts/search", async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "query param required" });

    try {
      const regex = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const [filteredPosts] = await db.query(
        "SELECT * FROM posts WHERE title REGEXP ? OR content REGEXP ? LIMIT 100",
        [regex, regex]
      );
      const fuse = new Fuse(filteredPosts, { keys: ["title", "content"], threshold: 0.3 });
      res.json(fuse.search(query).map(({ item }) => item));
    } catch (err) {
      logger.error(`Search error: ${err.stack}`);
      res.status(500).json({ error: "Search error" });
    }
  });
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: "No file uploaded" });
  res.json({ success: true, filename: req.file.filename, originalname: req.file.originalname });
});

// --- Batch upload route (multiple files) ---
app.post("/upload-multiple", upload.array("files"), (req, res) => {
  if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: "No files uploaded" });
  const files = req.files.map(f => ({ filename: f.filename, originalname: f.originalname }));
  res.json({ success: true, files });
});
  // Post details (HTML or JSON)
  app.get("/api/posts/:id/details", async (req, res) => {
    try {
      const [rows] = await db.query("SELECT * FROM posts WHERE id = ?", [req.params.id]);
      if (!rows.length) return res.status(404).send("Post not found");

      const post = rows[0];
      if (req.accepts("html")) {
        res.send(`
          <html><head><title>${post.title}</title></head>
          <body>
            <h1>${post.title}</h1>
            <p>${post.content}</p>
            <p><small>Posted on: ${post.post_date}</small></p>
          </body></html>
        `);
      } else {
        res.json(post);
      }
    } catch (err) {
      logger.error(`Details fetch error: ${err.stack}`);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Start server
  (async () => {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Worker ${process.pid} running at http://localhost:${PORT}`);
    });
  })();
}
