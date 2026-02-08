import express from "express";
import { dbGet, dbAll, dbRun } from "../database/db.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Get user's eco-points and stats
router.get("/my-points", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's current eco-points
    const user = await dbGet("SELECT eco_points FROM users WHERE id = ?", [
      userId,
    ]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get total registered events
    const eventsRegistered = await dbGet(
      "SELECT COUNT(*) as count FROM event_participants WHERE user_id = ?",
      [userId]
    );

    // Get user's rank (only among students and volunteers)
    const rankQuery = await dbGet(
      `SELECT COUNT(*) + 1 as rank 
       FROM users 
       WHERE eco_points > (SELECT eco_points FROM users WHERE id = ?)
       AND role IN ('student', 'volunteer')`,
      [userId]
    );

    // Get eco-points earned this month (where verified = 1)
    const monthlyPoints = await dbGet(
      `SELECT SUM(eco_points_earned) as points 
   FROM recycling_logs 
   WHERE user_id = ? 
   AND verified = 1
   AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')`,
      [userId]
    );

    // Get eco-points earned this week (where verified = 1)
    const weeklyPoints = await dbGet(
      `SELECT SUM(eco_points_earned) as points 
   FROM recycling_logs 
   WHERE user_id = ? 
   AND verified = 1
   AND strftime('%Y-%W', created_at) = strftime('%Y-%W', 'now')`,
      [userId]
    );

    const eventsAttended = await dbGet(
      "SELECT COUNT(*) as count FROM event_participants WHERE user_id = ? AND attended = 1",
      [userId]
    );

    res.json({
      eco_points: user.eco_points || 0,
      rank: rankQuery.rank,
      events_attended: eventsAttended.count,
      events_registered: eventsRegistered.count,
      monthly_points: monthlyPoints.points || 0,
      weekly_points: weeklyPoints.points || 0,
    });
  } catch (error) {
    console.error("Eco-points fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get leaderboard/ranking
router.get("/leaderboard", async (req, res) => {
  try {
    const { limit = 10, role } = req.query;

    let query = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.eco_points,
        (SELECT COUNT(*) FROM event_participants WHERE user_id = u.id AND attended = 1) as events_attended
      FROM users u
      WHERE u.role IN ('student', 'volunteer')
    `;
    const params = [];

    // Filter by specific role if specified (must be student or volunteer)
    if (role && (role === "student" || role === "volunteer")) {
      query += " AND u.role = ?";
      params.push(role);
    }

    query += " ORDER BY u.eco_points DESC, u.name ASC LIMIT ?";
    params.push(parseInt(limit));

    const users = await dbAll(query, params);

    // Add rank to each user
    const leaderboard = users.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    res.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get user's rank and nearby competitors
router.get("/my-rank", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's info
    const user = await dbGet(
      "SELECT id, name, email, eco_points FROM users WHERE id = ?",
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's rank (only among students and volunteers)
    const rankQuery = await dbGet(
      `SELECT COUNT(*) + 1 as rank 
       FROM users 
       WHERE eco_points > ?
       AND role IN ('student', 'volunteer')`,
      [user.eco_points]
    );

    // Get users above (3 users) - only students and volunteers
    const usersAbove = await dbAll(
      `SELECT id, name, eco_points 
       FROM users 
       WHERE eco_points > ? 
       AND role IN ('student', 'volunteer')
       ORDER BY eco_points ASC, name ASC 
       LIMIT 3`,
      [user.eco_points]
    );

    // Get users below (3 users) - only students and volunteers
    const usersBelow = await dbAll(
      `SELECT id, name, eco_points 
       FROM users 
       WHERE eco_points < ? 
       AND role IN ('student', 'volunteer')
       ORDER BY eco_points DESC, name ASC 
       LIMIT 3`,
      [user.eco_points]
    );

    // Get total users count (only students and volunteers)
    const totalUsers = await dbGet(
      "SELECT COUNT(*) as count FROM users WHERE role IN ('student', 'volunteer')"
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        eco_points: user.eco_points,
        rank: rankQuery.rank,
      },
      users_above: usersAbove.reverse(), // Reverse to show highest first
      users_below: usersBelow,
      total_users: totalUsers.count,
    });
  } catch (error) {
    console.error("Rank fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Award eco-points (organizer/admin only)
router.post(
  "/award",
  authenticateToken,
  authorizeRoles("organizer", "admin"),
  async (req, res) => {
    try {
      const { user_id, points, reason } = req.body;

      if (!user_id || !points) {
        return res
          .status(400)
          .json({ error: "User ID and points are required" });
      }

      if (points <= 0) {
        return res.status(400).json({ error: "Points must be positive" });
      }

      // Check if user exists
      const user = await dbGet("SELECT * FROM users WHERE id = ?", [user_id]);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Award points
      await dbRun("UPDATE users SET eco_points = eco_points + ? WHERE id = ?", [
        points,
        user_id,
      ]);

      // Get updated user
      const updatedUser = await dbGet("SELECT * FROM users WHERE id = ?", [
        user_id,
      ]);

      res.json({
        message: "Eco-points awarded successfully",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          eco_points: updatedUser.eco_points,
        },
        points_awarded: points,
        reason: reason || "Manual award",
      });
    } catch (error) {
      console.error("Award points error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get eco-points history for a specific user (admin/organizer only)
router.get("/history/:userId", authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if requesting own history or if admin/organizer
    if (
      userId != req.user.id &&
      !["admin", "organizer"].includes(req.user.role)
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get events attended with points awarded
    const history = await dbAll(
      `SELECT 
        e.id as event_id,
        e.title as event_title,
        e.event_date,
        e.eco_points_awarded,
        ep.attended,
        ep.registered_at
      FROM event_participants ep
      JOIN events e ON ep.event_id = e.id
      WHERE ep.user_id = ?
      ORDER BY e.event_date DESC`,
      [userId]
    );

    const totalPoints = history
      .filter((h) => h.attended)
      .reduce((sum, h) => sum + (h.eco_points_awarded || 0), 0);

    res.json({
      history,
      total_points: totalPoints,
      events_count: history.length,
      attended_count: history.filter((h) => h.attended).length,
    });
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get eco-points history for current user
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get events attended with points awarded
    const history = await dbAll(
      `SELECT 
        e.id as event_id,
        e.title as event_title,
        e.event_date,
        e.eco_points_awarded,
        ep.attended,
        ep.registered_at
      FROM event_participants ep
      JOIN events e ON ep.event_id = e.id
      WHERE ep.user_id = ?
      ORDER BY e.event_date DESC`,
      [userId]
    );

    const totalPoints = history
      .filter((h) => h.attended)
      .reduce((sum, h) => sum + (h.eco_points_awarded || 0), 0);

    res.json({
      history,
      total_points: totalPoints,
      events_count: history.length,
      attended_count: history.filter((h) => h.attended).length,
    });
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
