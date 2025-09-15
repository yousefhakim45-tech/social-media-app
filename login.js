import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mysql from "mysql2/promise";
import multer from "multer";
import path from "path";
import fs from "fs";
import morgan from "morgan";
import chalk from "chalk";
import twilio from "twilio";
import puppeteer from "puppeteer-core";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(bodyParser.json());
app.use("/uploads", express.static("uploads"));
app.use("/images", express.static(path.join(process.cwd(), "images")));

// Logging
app.use(
  morgan((tokens, req, res) => {
    return [
      chalk.blue(tokens.method(req, res)),
      chalk.yellow(tokens.url(req, res)),
      chalk.green(tokens.status(req, res)),
      chalk.magenta(tokens["response-time"](req, res) + " ms"),
    ].join(" ");
  })
);

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// MySQL pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "testdb",
  waitForConnections: true,
  connectionLimit: 10,
});

// Twilio config
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// In-memory OTP store
const otpStore = {};

// Utility: Normalize phone to E.164 (+20)
function formatPhoneNumber(phone) {
  if (!phone) return null;
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = "+20" + cleaned.substring(1);
  if (!cleaned.startsWith("+")) cleaned = "+" + cleaned;
  return cleaned;
}

// ✅ Generate OTP HTML for response
function generateOtpHtml(otp) {
  return `
    <div style="display:flex; align-items:center; justify-content:center; height:200px; font-family:Arial, sans-serif; background:#fff;">
      <div style="text-align:center; border:2px solid #0b8a2b; padding:20px; border-radius:12px;">
        <div style="font-size:24px; color:#0b8a2b; font-weight:bold;">Your OTP</div>
        <div style="font-size:36px; color:#0b8a2b; font-weight:bold; margin-top:10px;"></div>
        <div style="font-size:14px; color:#555; margin-top:8px;">Do not share this code with anyone</div>
      </div>
    </div>
  `;
}

/* ---------------------- USER REGISTRATION ---------------------- */
app.post("/api/users", upload.single("photo"), async (req, res) => {
  let conn;
  try {
    const { name, email, phone, role, gender, description } = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    if (!name || !email) {
      return res.status(400).json({ error: "Name & email required" });
    }

    conn = await pool.getConnection();
    const [result] = await conn.query(
      "INSERT INTO users (name, email, phone, role, gender, description, photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, email, phone, role, gender, description, photo]
    );

    // Return user info only, no TOTP or QR
    res.json({
      success: true,
      id: result.insertId,
      photo,
      name,
      email,
      phone,
      role,
      gender,
      description
    });
  } catch (err) {
    console.error(chalk.red("🔥 Error saving user:"), err.message);
    res.status(500).json({ error: "Failed to save user" });
  } finally {
    if (conn) conn.release();
  }
});

// 🔹 Send OTP via WhatsApp
app.post("/send-otp", async (req, res) => {
  let { phone } = req.body;
  phone = formatPhoneNumber(phone);

  if (!phone) return res.status(400).json({ message: "Invalid phone number" });

  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[phone] = otp;

    // Generate HTML for response
    const otpHtml = generateOtpHtml(otp);

    // Send OTP via WhatsApp (plain text only)
    await client.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:${phone}`,
      body: `Your OTP is ${otp}`, // plain text for WhatsApp
    });

    res.json({
      message: "OTP sent via WhatsApp!",
      html: otpHtml  // return styled HTML block
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// 🔹 Verify OTP
app.post("/verify-otp", (req, res) => {
  let { phone, code } = req.body;
  phone = formatPhoneNumber(phone);

  const storedOtp = otpStore[phone];
  if (storedOtp && storedOtp === code) {
    delete otpStore[phone];
    return res.json({ message: "Phone verified successfully!" });
  } else {
    return res.status(400).json({ message: "Invalid verification code." });
  }
});
/* ---------------------- USER LOGOUT ---------------------- */
app.post("/api/logout", async (req, res) => {
  let conn;
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID required" });
    }

    conn = await pool.getConnection();

    // Delete user from DB
    const [result] = await conn.query("DELETE FROM users WHERE id = ?", [userId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, message: "User logged out and removed from DB" });
  } catch (err) {
    console.error(chalk.red("🔥 Error logging out user:"), err.message);
    res.status(500).json({ error: "Failed to log out user" });
  } finally {
    if (conn) conn.release();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(chalk.cyan(`🚀 Server running at http://localhost:${PORT}`));
});
