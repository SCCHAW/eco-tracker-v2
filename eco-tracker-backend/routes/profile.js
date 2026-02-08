import express from "express";
import { dbRun, dbGet } from "../database/db.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get user profile (combines users + user_profiles)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      `SELECT 
        u.id, u.name, u.email, u.role, u.eco_points, u.created_at,
        p.phone_number, p.address, p.student_id, p.major_program, 
        p.year, p.interests, p.bio,
        p.emergency_contact_name, p.emergency_contact_phone,
        p.organization, p.position, p.department,
        p.emergency_contact_relationship, p.profile_picture_url
       FROM users u
       LEFT JOIN user_profiles p ON u.id = p.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error("Profile fetch error:", error);
    res.status(500).json({ error: "Server error" });
  }
});


// Update basic user info (name, email from users table)
router.put("/basic", authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    // Update basic info
    await dbRun(
      "UPDATE users SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name, req.user.id]
    );

    const updatedUser = await dbGet(
      "SELECT id, name, email, role, eco_points FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json({
      message: "Basic info updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Basic info update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Create or Update user profile
// router.put("/", authenticateToken, async (req, res) => {
//   try {
//     const {
//       phone_number,
//       address,
//       student_id,
//       major_program,
//       year,
//       organization,
//       position,
//       department,
//       interests,
//       bio,
//       emergency_contact_name,
//       emergency_contact_phone,
//       emergency_contact_relationship,
//     } = req.body;

//     // Check if profile exists
//     const existingProfile = await dbGet(
//       "SELECT id FROM user_profiles WHERE user_id = ?",
//       [req.user.id]
//     );

//     if (existingProfile) {
//       // Update existing profile
//       const updateFields = {};
//       const allowedFields = [
//         'phone_number', 'address', 'student_id', 'major_program', 'year',
//         'organization', 'position', 'department', 'interests', 'bio',
//         'emergency_contact_name', 'emergency_contact_phone', 
//         'emergency_contact_relationship'
//       ];
      
//       // Build update query dynamically based on provided fields
//       const updates = [];
//       const values = [];
      
//       allowedFields.forEach(field => {
//         if (req.body[field] !== undefined) {
//           updates.push(`${field} = ?`);
//           values.push(req.body[field]);
//         }
//       });
      
//       if (updates.length > 0) {
//         updates.push('updated_at = CURRENT_TIMESTAMP');
//         values.push(req.user.id);
        
//         const updateQuery = `
//           UPDATE user_profiles 
//           SET ${updates.join(', ')}
//           WHERE user_id = ?
//         `;
        
//         await dbRun(updateQuery, values);
//       }
//     } else {
//       // Create new profile - provide default values for all required fields
//       await dbRun(
//         `INSERT INTO user_profiles (
//           user_id, phone_number, address, student_id, major_program, 
//           year, organization, position, department, interests, bio, 
//           emergency_contact_name, emergency_contact_phone, 
//           emergency_contact_relationship
//         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         [
//           req.user.id,
//           phone_number || null,
//           address || null,
//           student_id || null,
//           major_program || null,
//           year || null,
//           organization || null,
//           position || null,
//           department || null,
//           interests || null,
//           bio || null,
//           emergency_contact_name || null,
//           emergency_contact_phone || null,
//           emergency_contact_relationship || null
//         ]
//       );
//     }

//     // Get updated profile
//     const updatedUser = await dbGet(
//       `SELECT 
//         u.id, u.name, u.email, u.role, u.eco_points,
//         p.phone_number, p.address, p.student_id, p.major_program, 
//         p.year, p.organization, p.position, p.department, 
//         p.interests, p.bio,
//         p.emergency_contact_name, p.emergency_contact_phone, 
//         p.emergency_contact_relationship
//        FROM users u
//        LEFT JOIN user_profiles p ON u.id = p.user_id
//        WHERE u.id = ?`,
//       [req.user.id]
//     );

//     res.json({
//       message: "Profile updated successfully",
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error("Profile update error:", error);
//     res.status(500).json({ error: "Server error", details: error.message });
//   }
// });


router.put("/", authenticateToken, async (req, res) => {
  try {
    const {
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

    // IMPORTANT: Check if student_id is being changed and conflicts with another user
    if (student_id) {
      const existingStudentId = await dbGet(
        "SELECT user_id FROM user_profiles WHERE student_id = ? AND user_id != ?",
        [student_id, req.user.id]
      );

      if (existingStudentId) {
        return res.status(400).json({ 
          error: "Student ID already exists",
          details: `Student ID "${student_id}" is already assigned to another user.`
        });
      }
    }

    // Check if profile exists
    const existingProfile = await dbGet(
      "SELECT id FROM user_profiles WHERE user_id = ?",
      [req.user.id]
    );

    if (existingProfile) {
      // Update existing profile
      const allowedFields = [
        'phone_number', 'address', 'student_id', 'major_program', 'year',
        'organization', 'position', 'department', 'interests', 'bio',
        'emergency_contact_name', 'emergency_contact_phone', 
        'emergency_contact_relationship'
      ];

      // Build update query dynamically based on provided fields
      const updates = [];
      const values = [];

      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          updates.push(`${field} = ?`);
          values.push(req.body[field]);
        }
      });

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.user.id);

        const updateQuery = `
          UPDATE user_profiles 
          SET ${updates.join(', ')}
          WHERE user_id = ?
        `;

        await dbRun(updateQuery, values);
      }
    } else {
      // Create new profile - provide default values for all required fields
      await dbRun(
        `INSERT INTO user_profiles (
          user_id, phone_number, address, student_id, major_program, 
          year, organization, position, department, interests, bio, 
          emergency_contact_name, emergency_contact_phone, 
          emergency_contact_relationship
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.id,
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
          emergency_contact_relationship || null
        ]
      );
    }

    // Get updated profile
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
      [req.user.id]
    );

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    
    // Handle specific SQLite constraint errors
    if (error.code === 'SQLITE_CONSTRAINT') {
      if (error.message.includes('student_id')) {
        return res.status(400).json({
          error: "Student ID already exists",
          details: "This student ID is already assigned to another user."
        });
      }
    }
    
    res.status(500).json({ 
      error: "Server error", 
      details: error.message 
    });
  }
});

router.put(
  "/userprofile/:userId",
  authenticateToken,
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
