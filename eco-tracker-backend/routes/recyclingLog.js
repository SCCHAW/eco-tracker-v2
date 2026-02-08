import express from "express";
import { dbGet, dbAll, dbRun } from "../database/db.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/recycling";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "recycling-" + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
      return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
  },
});

// SIMPLIFIED ROUTE - Remove the complicated middleware chain
// router.post(
//   "/submit",
//   authenticateToken,
//   authorizeRoles("student", "volunteer"),
//   upload.single("image"), // Just add this directly
//   async (req, res) => {
//     try {
//       const userId = req.user.id;

//       // Get data from form fields
//       const { category, weight, description, event_id, volunteerHours } =
//         req.body;
//       const image_url = req.file
//         ? `/uploads/recycling/${req.file.filename}`
//         : null;

//       console.log("Recycling submission request:", {
//         userId,
//         body: req.body,
//         file: req.file,
//       });

//       // Validate required fields
//       if (!category || !weight) {
//         console.log("Missing required fields:", { category, weight });
//         return res.status(400).json({
//           error: "Category and weight are required",
//           details: {
//             received: { category, weight },
//             required: ["category", "weight"],
//           },
//         });
//       }

//       // Validate category
//       const validCategories = [
//         "plastic",
//         "paper",
//         "metal",
//         "glass",
//         "electronics",
//         "organic",
//         "other",
//       ];
//       if (!validCategories.includes(category)) {
//         console.log("Invalid category:", category);
//         return res.status(400).json({
//           error: "Invalid category",
//           details: {
//             received: category,
//             valid: validCategories,
//           },
//         });
//       }

//       // Validate weight
//       const parsedWeight = parseFloat(weight);
//       if (isNaN(parsedWeight)) {
//         console.log("Invalid weight (not a number):", weight);
//         return res.status(400).json({
//           error: "Weight must be a valid number",
//           details: { received: weight },
//         });
//       }

//       if (parsedWeight <= 0) {
//         console.log("Invalid weight (<= 0):", parsedWeight);
//         return res.status(400).json({
//           error: "Weight must be greater than 0",
//           details: { received: parsedWeight },
//         });
//       }

//       // Check if user exists
//       const userExists = await dbGet(
//         "SELECT id, name, role FROM users WHERE id = ?",
//         [userId]
//       );

//       if (!userExists) {
//         console.log("User not found:", userId);
//         return res.status(404).json({ error: "User not found" });
//       }

//       let parsedVolunteerHours = 0;
//       if (userExists.role === "volunteer") {
//         if (!volunteerHours) {
//           return res.status(400).json({
//             error: "Volunteer hours required",
//             details: "Volunteers must specify hours volunteered.",
//           });
//         }

//         parsedVolunteerHours = parseInt(volunteerHours);
//         if (isNaN(parsedVolunteerHours) || parsedVolunteerHours < 0) {
//           return res.status(400).json({
//             error: "Invalid volunteer hours",
//             details: "Volunteer hours must be a valid positive number.",
//           });
//         }
//       }

//       console.log("User found:", userExists);

//       // Check for duplicate submission
//       const duplicateCheckQuery = `
//         SELECT id FROM recycling_logs 
//         WHERE user_id = ? 
//         AND category = ? 
//         AND weight = ?
//         AND event_id ${event_id ? "= ?" : "IS ?"}
//         AND created_at > datetime('now', '-30 minutes')
//       `;

//       const duplicateParams = event_id
//         ? [userId, category, parsedWeight, event_id]
//         : [userId, category, parsedWeight, null];

//       const recentDuplicate = await dbGet(duplicateCheckQuery, duplicateParams);

//       if (recentDuplicate) {
//         console.log("Duplicate submission detected:", recentDuplicate);
//         return res.status(400).json({
//           error: "Duplicate submission detected",
//           details: event_id
//             ? "You've already submitted this exact recycling log for this event in the last 30 minutes."
//             : "You've already submitted this exact recycling log in the last 30 minutes.",
//         });
//       }

//       // If event_id is provided, validate it exists and user is registered
//       if (event_id) {
//         const eventExists = await dbGet("SELECT id FROM events WHERE id = ?", [
//           event_id,
//         ]);

//         if (!eventExists) {
//           return res.status(400).json({
//             error: "Invalid event",
//             details: "The specified event does not exist.",
//           });
//         }

//         // Check if user is registered for this event
//         const isRegistered = await dbGet(
//           "SELECT id FROM event_participants WHERE user_id = ? AND event_id = ?",
//           [userId, event_id]
//         );

//         if (!isRegistered) {
//           return res.status(400).json({
//             error: "Not registered for event",
//             details:
//               "You must be registered for the event to submit recycling logs for it.",
//           });
//         }
//       }

//       try {
//         // Insert recycling log
//         console.log("Attempting to insert recycling log...");
//         const result = await dbRun(
//           `INSERT INTO recycling_logs (user_id, category, weight, description, image_url, event_id, verified, volunteer_hours) 
//            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//           [
//             userId,
//             category,
//             parsedWeight,
//             description || null,
//             image_url || null,
//             event_id || null,
//             0,
//             parsedVolunteerHours || 0,
//           ]
//         );

//         console.log("Insert successful, lastID:", result.lastID);

//         // Get the created log with event details
//         const logQuery = `
//           SELECT 
//             rl.*, 
//             u.name as user_name, 
//             u.email as user_email,
//             e.title as event_title,
//             e.event_date as event_date
//           FROM recycling_logs rl
//           JOIN users u ON rl.user_id = u.id
//           LEFT JOIN events e ON rl.event_id = e.id
//           WHERE rl.id = ?
//         `;

//         const log = await dbGet(logQuery, [result.lastID]);

//         console.log("Log retrieved:", log);

//         res.status(201).json({
//           message:
//             "Recycling log submitted successfully. Waiting for admin approval.",
//           log,
//           submissionId: result.lastID,
//           image_url: image_url,
//         });
//       } catch (dbError) {
//         console.error("Database error during insertion:", dbError);

//         // If there was an error and a file was uploaded, delete it
//         if (req.file && fs.existsSync(req.file.path)) {
//           fs.unlinkSync(req.file.path);
//         }

//         // Check for specific SQLite errors
//         if (dbError.code === "SQLITE_ERROR") {
//           if (dbError.message.includes("no such table")) {
//             return res.status(500).json({
//               error: "Database table not found",
//               details:
//                 "The recycling_logs table does not exist. Please run migrations.",
//               debug: dbError.message,
//             });
//           }

//           if (dbError.message.includes("has no column")) {
//             return res.status(500).json({
//               error: "Database schema mismatch",
//               details:
//                 "The recycling_logs table schema does not match expected columns.",
//               debug: dbError.message,
//             });
//           }

//           if (dbError.message.includes("FOREIGN KEY constraint failed")) {
//             return res.status(400).json({
//               error: "Invalid event reference",
//               details: "The specified event does not exist.",
//             });
//           }
//         }

//         throw dbError;
//       }
//     } catch (error) {
//       console.error("Submit recycling log error:", error);

//       // If there was an error and a file was uploaded, delete it
//       if (req.file && fs.existsSync(req.file.path)) {
//         fs.unlinkSync(req.file.path);
//       }

//       res.status(500).json({
//         error: "Server error",
//         details: error.message, // Always show error in development
//         type: error.name,
//         code: error.code,
//       });
//     }
//   }
// );

router.post(
  "/submit",
  authenticateToken,
  authorizeRoles("student", "volunteer"),
  upload.single("image"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      // Get data from form fields
      const { category, weight, description, event_id, volunteerHours } =
        req.body;
      const image_url = req.file
        ? `/uploads/recycling/${req.file.filename}`
        : null;

      console.log("Recycling submission request:", {
        userId,
        body: req.body,
        file: req.file,
      });

      // Validate required fields
      if (!category || !weight) {
        console.log("Missing required fields:", { category, weight });
        return res.status(400).json({
          error: "Category and weight are required",
          details: {
            received: { category, weight },
            required: ["category", "weight"],
          },
        });
      }

      // Validate category
      const validCategories = [
        "plastic",
        "paper",
        "metal",
        "glass",
        "electronics",
        "organic",
        "other",
      ];
      if (!validCategories.includes(category)) {
        console.log("Invalid category:", category);
        return res.status(400).json({
          error: "Invalid category",
          details: {
            received: category,
            valid: validCategories,
          },
        });
      }

      // Validate weight
      const parsedWeight = parseFloat(weight);
      if (isNaN(parsedWeight)) {
        console.log("Invalid weight (not a number):", weight);
        return res.status(400).json({
          error: "Weight must be a valid number",
          details: { received: weight },
        });
      }

      if (parsedWeight <= 0) {
        console.log("Invalid weight (<= 0):", parsedWeight);
        return res.status(400).json({
          error: "Weight must be greater than 0",
          details: { received: parsedWeight },
        });
      }

      // Check if user exists
      const userExists = await dbGet(
        "SELECT id, name, role FROM users WHERE id = ?",
        [userId]
      );

      if (!userExists) {
        console.log("User not found:", userId);
        return res.status(404).json({ error: "User not found" });
      }

      let parsedVolunteerHours = 0;
      if (userExists.role === "volunteer") {
        if (!volunteerHours) {
          return res.status(400).json({
            error: "Volunteer hours required",
            details: "Volunteers must specify hours volunteered.",
          });
        }

        parsedVolunteerHours = parseInt(volunteerHours);
        if (isNaN(parsedVolunteerHours) || parsedVolunteerHours < 0) {
          return res.status(400).json({
            error: "Invalid volunteer hours",
            details: "Volunteer hours must be a valid positive number.",
          });
        }
      }

      console.log("User found:", userExists);

      // ========================================
      // DUPLICATE CHECK
      // ========================================
      
      if (event_id) {
        // FOR EVENT-BASED SUBMISSIONS: One log per event
        const existingEventSubmission = await dbGet(
          `SELECT id, category, weight, verified, created_at 
           FROM recycling_logs 
           WHERE user_id = ? 
           AND event_id = ?`,
          [userId, event_id]
        );

        if (existingEventSubmission) {
          console.log("Duplicate event submission detected:", existingEventSubmission);
          return res.status(400).json({
            error: "Duplicate submission detected",
            details: `You have already submitted a recycling log for this event. Each user can only submit one log per event.`,
          });
        }
        
        // Validate event exists
        const eventExists = await dbGet("SELECT id FROM events WHERE id = ?", [
          event_id,
        ]);

        if (!eventExists) {
          return res.status(400).json({
            error: "Invalid event",
            details: "The specified event does not exist.",
          });
        }

        // Check if user is registered for this event
        const isRegistered = await dbGet(
          "SELECT id FROM event_participants WHERE user_id = ? AND event_id = ?",
          [userId, event_id]
        );

        if (!isRegistered) {
          return res.status(400).json({
            error: "Not registered for event",
            details:
              "You must be registered for the event to submit recycling logs for it.",
          });
        }
        
      } else {
        // FOR NON-EVENT SUBMISSIONS: No duplicate category + weight combination
        const existingDuplicate = await dbGet(
          `SELECT id, created_at, verified
           FROM recycling_logs 
           WHERE user_id = ? 
           AND category = ? 
           AND weight = ?
           AND event_id IS NULL`,
          [userId, category, parsedWeight]
        );

        if (existingDuplicate) {
          console.log("Duplicate non-event submission detected:", existingDuplicate);
          return res.status(400).json({
            error: "Duplicate submission detected",
            details: `You have already submitted this exact recycling log (${category}, ${parsedWeight}kg). Each combination of category and weight can only be submitted once.`,
          });
        }
      }

      try {
        // Insert recycling log
        console.log("Attempting to insert recycling log...");
        const result = await dbRun(
          `INSERT INTO recycling_logs (user_id, category, weight, description, image_url, event_id, verified, volunteer_hours) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            category,
            parsedWeight,
            description || null,
            image_url || null,
            event_id || null,
            0,
            parsedVolunteerHours || 0,
          ]
        );

        console.log("Insert successful, lastID:", result.lastID);

        // Get the created log with event details
        const logQuery = `
          SELECT 
            rl.*, 
            u.name as user_name, 
            u.email as user_email,
            e.title as event_title,
            e.event_date as event_date
          FROM recycling_logs rl
          JOIN users u ON rl.user_id = u.id
          LEFT JOIN events e ON rl.event_id = e.id
          WHERE rl.id = ?
        `;

        const log = await dbGet(logQuery, [result.lastID]);

        console.log("Log retrieved:", log);

        res.status(201).json({
          message:
            "Recycling log submitted successfully. Waiting for admin approval.",
          log,
          submissionId: result.lastID,
          image_url: image_url,
        });
      } catch (dbError) {
        console.error("Database error during insertion:", dbError);

        // If there was an error and a file was uploaded, delete it
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        // Check for specific SQLite errors
        if (dbError.code === "SQLITE_ERROR") {
          if (dbError.message.includes("no such table")) {
            return res.status(500).json({
              error: "Database table not found",
              details:
                "The recycling_logs table does not exist. Please run migrations.",
              debug: dbError.message,
            });
          }

          if (dbError.message.includes("has no column")) {
            return res.status(500).json({
              error: "Database schema mismatch",
              details:
                "The recycling_logs table schema does not match expected columns.",
              debug: dbError.message,
            });
          }

          if (dbError.message.includes("FOREIGN KEY constraint failed")) {
            return res.status(400).json({
              error: "Invalid event reference",
              details: "The specified event does not exist.",
            });
          }
        }

        throw dbError;
      }
    } catch (error) {
      console.error("Submit recycling log error:", error);

      // If there was an error and a file was uploaded, delete it
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        error: "Server error",
        details: error.message,
        type: error.name,
        code: error.code,
      });
    }
  }
);


router.get("/my-logs", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get logs with event title and verified_by name
    const logs = await dbAll(
      `SELECT 
        rl.*, 
        u.name as user_name,
        e.title as event_title,
        e.event_date as event_date,
        e.location as event_location,
        v.name as verified_by_name
       FROM recycling_logs rl
       JOIN users u ON rl.user_id = u.id
       LEFT JOIN events e ON rl.event_id = e.id
       LEFT JOIN users v ON rl.verified_by = v.id
       WHERE rl.user_id = ?
       ORDER BY rl.created_at DESC`,
      [userId]
    );
    
    const stats = await dbGet(
      `SELECT 
        COUNT(*) as total_logs,
        SUM(weight) as total_weight,
        SUM(eco_points_earned) as total_points,
        SUM(volunteer_hours) as total_hours,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN verified = 0 THEN 1 ELSE 0 END) as pending_count
       FROM recycling_logs
       WHERE user_id = ?`,
      [userId]
    );
    
    res.json({
      logs,
      stats: {
        total_logs: stats.total_logs || 0,
        total_weight: stats.total_weight || 0,
        total_points: stats.total_points || 0,
        total_hours: stats.total_hours || 0,
        approved_count: stats.approved_count || 0,
        pending_count: stats.pending_count || 0,
      },
    });
  } catch (error) {
    console.error("Get my logs error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all recycling logs (admin only)
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { status, category, user_id } = req.query;

      let query = `
      SELECT rl.*, 
             u.name as user_name, 
             u.email as user_email,
             u.role as user_role,
             v.name as verified_by_name
      FROM recycling_logs rl
      JOIN users u ON rl.user_id = u.id
      LEFT JOIN users v ON rl.verified_by = v.id
      WHERE 1=1
    `;
      const params = [];

      if (status === "pending") {
        query += " AND rl.verified = 0";
      } else if (status === "approved") {
        query += " AND rl.verified = 1";
      }

      if (category) {
        query += " AND rl.category = ?";
        params.push(category);
      }

      if (user_id) {
        query += " AND rl.user_id = ?";
        params.push(user_id);
      }

      query += " ORDER BY rl.created_at DESC";

      const logs = await dbAll(query, params);

      res.json({ logs });
    } catch (error) {
      console.error("Get all logs error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get pending recycling logs (admin only)
router.get(
  "/pending",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const logs = await dbAll(
        `SELECT rl.*, 
             u.name as user_name, 
             u.email as user_email,
             u.role as user_role,
             e.title as event_title,
             e.eco_points_reward as event_eco_points
       FROM recycling_logs rl
       JOIN users u ON rl.user_id = u.id
       LEFT JOIN events e ON rl.event_id = e.id
       WHERE rl.verified = 0
       ORDER BY rl.created_at DESC`
      );

      res.json({ logs });
    } catch (error) {
      console.error("Get pending logs error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.patch(
  "/:id/approve",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const logId = req.params.id;
      const adminId = req.user.id;

      // 1. Get the recycling log details
      const log = await dbGet("SELECT * FROM recycling_logs WHERE id = ?", [
        logId,
      ]);

      if (!log) {
        return res.status(404).json({ error: "Recycling log not found" });
      }

      // Check if already verified
      if (log.verified) {
        return res.status(400).json({ error: "Log already approved" });
      }

      // 2. Get eco points from the event
      const event = await dbGet(
        "SELECT eco_points_reward FROM events WHERE id = ?",
        [log.event_id]
      );

      if (!event) {
        return res.status(404).json({ error: "Associated event not found" });
      }

      const ecoPointsToAward = event.eco_points_reward;

      // 3. Update the recycling_logs table
      await dbRun(
        `UPDATE recycling_logs 
         SET verified = 1, 
             verified_by = ?, 
             verified_at = CURRENT_TIMESTAMP,
             eco_points_earned = ?
         WHERE id = ?`,
        [adminId, ecoPointsToAward, logId]
      );

      // 4. Update user's eco_points in users table
      await dbRun(
        `UPDATE users 
         SET eco_points = eco_points + ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [ecoPointsToAward, log.user_id]
      );

      // 5. Mark participant as attended in event_participants table
      await dbRun(
        `UPDATE event_participants 
         SET attended = 1
         WHERE event_id = ? AND user_id = ?`,
        [log.event_id, log.user_id]
      );

      // 6. Get updated log with user details
      const updatedLog = await dbGet(
        `SELECT 
          rl.*,
          u.name as user_name,
          u.email as user_email,
          u.role as user_role,
          u.eco_points as user_total_eco_points,
          e.title as event_title,
          e.eco_points_reward as event_eco_points,
          admin.name as verified_by_name,
          ep.attended as participant_attended
         FROM recycling_logs rl
         JOIN users u ON rl.user_id = u.id
         LEFT JOIN events e ON rl.event_id = e.id
         LEFT JOIN users admin ON rl.verified_by = admin.id
         LEFT JOIN event_participants ep ON ep.event_id = rl.event_id AND ep.user_id = rl.user_id
         WHERE rl.id = ?`,
        [logId]
      );

      res.json({
        message: "Recycling log approved successfully",
        log: updatedLog,
        eco_points_awarded: ecoPointsToAward,
        participant_marked_attended: true,
      });
    } catch (error) {
      console.error("Approve log error:", error);
      res.status(500).json({ error: "Server error", details: error.message });
    }
  }
);

// Reject a recycling log (admin only)
router.patch(
  "/:id/reject",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const logId = req.params.id;
      const { reason } = req.body;

      // Get the recycling log
      const log = await dbGet("SELECT * FROM recycling_logs WHERE id = ?", [
        logId,
      ]);

      if (!log) {
        return res.status(404).json({ error: "Recycling log not found" });
      }

      if (log.verified) {
        return res
          .status(400)
          .json({ error: "This log has already been verified" });
      }

      if (log.image_url) {
        const imagePath = path.join(__dirname, "..", log.image_url);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            console.log("Deleted image file:", imagePath);
          } catch (fileErr) {
            console.error("Error deleting image file:", fileErr);
            // Continue even if file deletion fails
          }
        }
      }

      // Delete the rejected log
      await dbRun("DELETE FROM recycling_logs WHERE id = ?", [logId]);

      // Create notification for the user
      await dbRun(
        `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
        [
          log.user_id,
          "Recycling Log Rejected",
          reason ||
            `Your recycling log (${log.category}, ${log.weight}kg) has been rejected, if you think this was a mistake, kindly re-submit your logs.`,
          "system",
        ]
      );

      res.json({
        message: "Recycling log rejected and deleted",
        reason: reason || "No reason provided",
        deletedLog: {
          id: log.id,
          category: log.category,
          weight: log.weight,
        },
      });
    } catch (error) {
      console.error("Reject log error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get recycling statistics (authenticated users)
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's stats
    const userStats = await dbGet(
      `SELECT 
        COUNT(*) as total_logs,
        SUM(weight) as total_weight,
        SUM(eco_points_earned) as total_points,
        SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as approved_count
       FROM recycling_logs
       WHERE user_id = ? AND verified = 1`,
      [userId]
    );

    // Get category breakdown
    const categoryStats = await dbAll(
      `SELECT 
        category,
        COUNT(*) as count,
        SUM(weight) as total_weight,
        SUM(eco_points_earned) as total_points
       FROM recycling_logs
       WHERE user_id = ? AND verified = 1
       GROUP BY category
       ORDER BY total_weight DESC`,
      [userId]
    );

    res.json({
      total_logs: userStats.total_logs || 0,
      total_weight: userStats.total_weight || 0,
      total_points: userStats.total_points || 0,
      approved_count: userStats.approved_count || 0,
      by_category: categoryStats,
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete a recycling log (own log only, if not yet verified)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const logId = req.params.id;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    // Get the log
    const log = await dbGet("SELECT * FROM recycling_logs WHERE id = ?", [
      logId,
    ]);

    if (!log) {
      return res.status(404).json({ error: "Recycling log not found" });
    }

    // Check permissions
    if (!isAdmin && log.user_id !== userId) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Prevent deletion if already verified (only admin can delete verified logs)
    if (log.verified && !isAdmin) {
      return res.status(400).json({ error: "Cannot delete verified logs" });
    }

    // Delete the log
    await dbRun("DELETE FROM recycling_logs WHERE id = ?", [logId]);

    res.json({ message: "Recycling log deleted successfully" });
  } catch (error) {
    console.error("Delete log error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
