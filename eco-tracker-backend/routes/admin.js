import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { dbGet, dbAll, dbRun } from "../database/db.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Admin-only endpoint for creating users
// In your users.js router file
// Admin-only endpoint for creating users
router.post(
  "/create",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;

      // Validate required fields
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          error: "Name, email, password, and role are required",
        });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "Password must be at least 6 characters" });
      }

      // Validate role
      const validRoles = ["student", "organizer", "volunteer", "admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error:
            "Invalid role. Must be: student, organizer, volunteer, or admin",
        });
      }

      // Check if email already exists
      const existingUser = await dbGet("SELECT id FROM users WHERE email = ?", [
        email,
      ]);

      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password (make sure to import bcrypt or your password hasher)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const result = await dbRun(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, role]
      );

      const token = jwt.sign(
        { id: result.id, email, role: role || "student" },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const newUserId = result.lastID;

      res.status(201).json({
        message: "User created successfully",
        token,
        user: {
          id: newUserId,
          name,
          email,
          role,
        },
      });
    } catch (error) {
      console.error("Admin create user error:", error);
      res.status(500).json({
        error: "Failed to create user",
        details: error.message,
      });
    }
  }
);

router.delete(
  "/:userId",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const adminId = req.user.id; // The admin making the request

      // Validate userId is a number
      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      const userIdInt = parseInt(userId);

      // Prevent admin from deleting themselves
      if (userIdInt === adminId) {
        return res.status(400).json({
          error: "Cannot delete your own account",
          details: "Please ask another admin to delete your account if needed.",
        });
      }

      // Check if user exists and get their role
      const user = await dbGet(
        "SELECT id, name, email, role FROM users WHERE id = ?",
        [userIdInt]
      );

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      console.log(
        `Starting deletion process for user: ${user.name} (${user.role})`
      );

      // Get user profile to check for profile picture
      const profile = await dbGet(
        "SELECT profile_picture_url FROM user_profiles WHERE user_id = ?",
        [userIdInt]
      );

      // Delete profile picture file if exists
      if (profile?.profile_picture_url) {
        const imagePath = path.join(
          __dirname,
          "..",
          profile.profile_picture_url
        );
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            console.log("Deleted profile picture:", imagePath);
          } catch (fileErr) {
            console.error("Error deleting profile picture:", fileErr);
          }
        }
      }

      // ========================================
      // ROLE-SPECIFIC DELETION LOGIC
      // ========================================

      if (user.role === "organizer") {
        console.log("User is an organizer - deleting their events");

        // Get all events organized by this user
        const events = await dbAll(
          "SELECT id, title FROM events WHERE organizer_id = ?",
          [userIdInt]
        );

        console.log(`Found ${events.length} events to delete`);

        for (const event of events) {
          // For each event, we need to:
          // 1. Delete event_participants (CASCADE will handle this automatically)
          // 2. Delete event_announcements (CASCADE will handle this automatically)
          // 3. Handle recycling_logs associated with this event

          // Get recycling logs for this event
          const recyclingLogs = await dbAll(
            "SELECT id, image_url FROM recycling_logs WHERE event_id = ?",
            [event.id]
          );

          console.log(
            `Event "${event.title}" has ${recyclingLogs.length} recycling logs`
          );

          // Delete recycling log images
          for (const log of recyclingLogs) {
            if (log.image_url) {
              const imagePath = path.join(__dirname, "..", log.image_url);
              if (fs.existsSync(imagePath)) {
                try {
                  fs.unlinkSync(imagePath);
                  console.log("Deleted recycling log image:", imagePath);
                } catch (fileErr) {
                  console.error("Error deleting recycling image:", fileErr);
                }
              }
            }
          }

          // IMPORTANT: We keep recycling logs but set event_id to NULL
          // This preserves students' records and eco points
          await dbRun(
            "UPDATE recycling_logs SET event_id = NULL WHERE event_id = ?",
            [event.id]
          );

          console.log(
            `Updated recycling logs for event "${event.title}" - set event_id to NULL`
          );

          // Delete the event (this will cascade to event_participants and event_announcements)
          await dbRun("DELETE FROM events WHERE id = ?", [event.id]);
          console.log(`Deleted event: ${event.title}`);
        }

        // Notify all participants of deleted events
        const participants = await dbAll(
          `SELECT DISTINCT ep.user_id, e.title 
           FROM event_participants ep
           JOIN events e ON ep.event_id = e.id
           WHERE e.organizer_id = ?`,
          [userIdInt]
        );

        for (const participant of participants) {
          await dbRun(
            `INSERT INTO notifications (user_id, title, message, type)
             VALUES (?, ?, ?, ?)`,
            [
              participant.user_id,
              "Event Cancelled",
              `The event "${participant.title}" has been cancelled as the organizer account was removed.`,
              "system",
            ]
          );
        }
      }

      // ========================================
      // DELETE USER'S OWN RECYCLING LOGS
      // ========================================
      // (For students, volunteers, or organizers who submitted logs)

      const userRecyclingLogs = await dbAll(
        "SELECT id, image_url FROM recycling_logs WHERE user_id = ?",
        [userIdInt]
      );

      console.log(`User has ${userRecyclingLogs.length} recycling logs`);

      // Delete recycling log images
      for (const log of userRecyclingLogs) {
        if (log.image_url) {
          const imagePath = path.join(__dirname, "..", log.image_url);
          if (fs.existsSync(imagePath)) {
            try {
              fs.unlinkSync(imagePath);
              console.log("Deleted user recycling log image:", imagePath);
            } catch (fileErr) {
              console.error("Error deleting user recycling image:", fileErr);
            }
          }
        }
      }

      // Delete user's recycling logs
      await dbRun("DELETE FROM recycling_logs WHERE user_id = ?", [userIdInt]);

      // ========================================
      // DELETE OTHER ASSOCIATED DATA
      // ========================================

      // Delete from user_profiles (CASCADE should handle, but explicit is safer)
      await dbRun("DELETE FROM user_profiles WHERE user_id = ?", [userIdInt]);

      // Delete from event_participants (CASCADE should handle)
      await dbRun("DELETE FROM event_participants WHERE user_id = ?", [
        userIdInt,
      ]);

      // Delete from notifications (CASCADE should handle)
      await dbRun("DELETE FROM notifications WHERE user_id = ?", [userIdInt]);

      // Delete from user_achievements (CASCADE should handle)
      await dbRun("DELETE FROM user_achievements WHERE user_id = ?", [
        userIdInt,
      ]);

      // Handle event_announcements where user was creator
      // Set created_by to NULL instead of deleting announcements
      await dbRun(
        "UPDATE event_announcements SET created_by = NULL WHERE created_by = ?",
        [userIdInt]
      );

      // Handle recycling_logs where user was verifier
      // Set verified_by to NULL instead of deleting logs
      await dbRun(
        "UPDATE recycling_logs SET verified_by = NULL WHERE verified_by = ?",
        [userIdInt]
      );

      // ========================================
      // FINALLY DELETE THE USER ACCOUNT
      // ========================================
      await dbRun("DELETE FROM users WHERE id = ?", [userIdInt]);

      console.log(
        `User deleted: ${user.name} (${user.email}) by admin ID: ${adminId}`
      );

      // Summary of what was deleted
      const summary = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        deletedData: {
          profile: true,
          recyclingLogs: userRecyclingLogs.length,
          notifications: true,
          achievements: true,
          eventParticipations: true,
        },
      };

      if (user.role === "organizer") {
        summary.deletedData.events = events.length;
        summary.note =
          "Recycling logs from deleted events were preserved but disassociated from events";
      }

      res.json({
        message: "User and associated data deleted successfully",
        summary,
      });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({
        error: "Server error",
        details: error.message,
      });
    }
  }
);

// PUT /api/admin/user-profile/:userId
router.put(
  "/userprofile/:userId",
  authenticateToken,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const userId = req.params.userId;
      const {
        name,
        phone_number,
        address,
        student_id,
        major_program,
        year,
        organization,
        position,
        department,
        interests,
        bio,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
      } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      // Validate userId is a number
      if (!userId || isNaN(parseInt(userId))) {
        return res.status(400).json({ error: "Valid user ID is required" });
      }

      const userIdInt = parseInt(userId);

      // Start transaction
      await dbRun("BEGIN TRANSACTION");

      try {
        // 1. Update basic user info
        await dbRun(
          "UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [name, userIdInt]
        );

        // 2. Check if student_id is being provided and if it's already taken by another user
        if (student_id && student_id.trim() !== "") {
          const existingStudent = await dbGet(
            "SELECT user_id FROM user_profiles WHERE student_id = ? AND user_id != ?",
            [student_id, userIdInt]
          );

          if (existingStudent) {
            await dbRun("ROLLBACK");
            return res.status(400).json({
              error: "Student ID already exists",
              details: "This student ID is already registered to another user",
            });
          }
        }

        // 3. Check if profile exists
        const existingProfile = await dbGet(
          "SELECT id FROM user_profiles WHERE user_id = ?",
          [userIdInt]
        );

        const allowedProfileFields = [
          "phone_number",
          "address",
          "student_id",
          "major_program",
          "year",
          "organization",
          "position",
          "department",
          "interests",
          "bio",
          "emergency_contact_name",
          "emergency_contact_phone",
          "emergency_contact_relationship",
        ];

        if (existingProfile) {
          // Update existing profile - dynamic update based on provided fields
          const updates = [];
          const values = [];

          allowedProfileFields.forEach((field) => {
            if (req.body[field] !== undefined) {
              // Handle empty strings by converting to null
              const value = req.body[field] === "" ? null : req.body[field];
              updates.push(`${field} = ?`);
              values.push(value);
            }
          });

          if (updates.length > 0) {
            updates.push("updated_at = CURRENT_TIMESTAMP");
            values.push(userIdInt);

            const updateQuery = `
              UPDATE user_profiles 
              SET ${updates.join(", ")}
              WHERE user_id = ?
            `;

            await dbRun(updateQuery, values);
          }
        } else {
          // Create new profile - handle empty strings by converting to null
          await dbRun(
            `INSERT INTO user_profiles (
              user_id, phone_number, address, student_id, major_program, 
              year, organization, position, department, interests, bio, 
              emergency_contact_name, emergency_contact_phone, 
              emergency_contact_relationship
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userIdInt,
              phone_number || null,
              address || null,
              student_id || null,
              major_program || null,
              year || null,
              organization || null,
              position || null,
              department || null,
              interests || null,
              bio || null,
              emergency_contact_name || null,
              emergency_contact_phone || null,
              emergency_contact_relationship || null,
            ]
          );
        }

        // Commit transaction
        await dbRun("COMMIT");

        // Get updated user with profile
        const updatedUser = await dbGet(
          `SELECT 
            u.id, u.name, u.email, u.role, u.eco_points,
            p.phone_number, p.address, p.student_id, p.major_program, 
            p.year, p.organization, p.position, p.department, 
            p.interests, p.bio,
            p.emergency_contact_name, p.emergency_contact_phone, 
            p.emergency_contact_relationship
           FROM users u
           LEFT JOIN user_profiles p ON u.id = p.user_id
           WHERE u.id = ?`,
          [userIdInt]
        );

        res.json({
          message: "Profile updated successfully",
          user: updatedUser,
        });
      } catch (error) {
        // Rollback transaction on error
        await dbRun("ROLLBACK");
        throw error;
      }
    } catch (error) {
      console.error("Profile update error:", error);

      // Handle specific SQLite constraint errors
      if (error.code === "SQLITE_CONSTRAINT") {
        if (error.message.includes("student_id")) {
          return res.status(400).json({
            error: "Student ID already exists",
            details:
              "This student ID is already registered to another user. Please use a different student ID.",
          });
        }
        if (error.message.includes("user_id")) {
          return res.status(400).json({
            error: "User profile already exists",
            details: "This user already has a profile.",
          });
        }
      }

      res.status(500).json({
        error: "Server error",
        details: error.message,
      });
    }
  }
);

export default router;
