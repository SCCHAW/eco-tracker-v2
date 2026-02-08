import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbRun, dbGet } from "../database/db.js";

const router = express.Router();

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Check if user exists
    const existingUser = await dbGet("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await dbRun(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role || "student"]
    );

    // Generate JWT token
    const token = jwt.sign(
      { id: result.id, email, role: role || "student" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: result.id,
        name,
        email,
        role: role || "student",
        
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res
        .status(400)
        .json({ error: "Email, password, and role are required" });
    }

    // Find user
    const user = await dbGet(
      "SELECT * FROM users WHERE email = ? AND role = ?",
      [email, role]
    );
    if (!user) {
      return res
        .status(401)
        .json({ error: "Invalid email or password or role" });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        eco_points: user.eco_points,

      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
});


// Forgot Password / Reset Password Route
router.post("/reset-password", async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;

    // Validate required fields
    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        error: "All fields are required",
        details: "Please provide email, password, and confirm password.",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email format",
        details: "Please enter a valid email address.",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        error: "Password too short",
        details: "Password must be at least 6 characters long.",
      });
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        error: "Passwords do not match",
        details: "Password and confirm password must be the same.",
      });
    }

    // Check if user exists
    const user = await dbGet(
      "SELECT id, name, email, role FROM users WHERE email = ?",
      [email.toLowerCase().trim()]
    );

    if (!user) {
      return res.status(404).json({
        error: "User not found",
        details: "No account exists with this email address.",
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password in database
    await dbRun(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [hashedPassword, user.id]
    );

    console.log(`Password reset successful for user: ${user.email}`);

    res.json({
      message: "Password reset successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      error: "Server error",
      details: "An error occurred while resetting your password.",
    });
  }
});

export default router;
