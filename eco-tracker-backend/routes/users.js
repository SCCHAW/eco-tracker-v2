import express from 'express';
import { dbGet, dbAll, dbRun } from '../database/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await dbGet(
      'SELECT id, name, email, role, eco_points, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get specific user profile by ID (requires user ID as parameter)
router.get('/profile/:userId', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate userId is a number
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

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
      [parseInt(userId)]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard (top users by eco points)
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const leaderboard = await dbAll(
      `SELECT id, name, role, eco_points, 
       (SELECT COUNT(*) FROM event_participants WHERE user_id = users.id AND attended = 1) as events_attended,
       (SELECT COUNT(*) FROM recycling_logs WHERE user_id = users.id AND verified = 1) as recycling_logs
       FROM users 
       ORDER BY eco_points DESC 
       LIMIT ?`,
      [limit]
    );

    res.json({ leaderboard });
  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user achievements
router.get('/achievements', authenticateToken, async (req, res) => {
  try {
    const achievements = await dbAll(
      `SELECT a.*, ua.earned_at
       FROM achievements a
       LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
       ORDER BY a.id`,
      [req.user.id]
    );

    res.json({ achievements });
  } catch (error) {
    console.error('Achievements fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users with pagination (admin only)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Get users with pagination
    const users = await dbAll(
      `SELECT 
        u.id, u.name, u.email, u.role, u.eco_points, u.created_at,
        (SELECT COUNT(*) FROM recycling_logs WHERE user_id = u.id) as total_logs,
        (SELECT COUNT(*) FROM recycling_logs WHERE user_id = u.id AND verified = 1) as approved_logs,
        (SELECT COUNT(*) FROM event_participants WHERE user_id = u.id) as events_registered,
        (SELECT COUNT(*) FROM event_participants WHERE user_id = u.id AND attended = 1) as events_attended
       FROM users u
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Get total count for pagination
    const totalCount = await dbGet('SELECT COUNT(*) as count FROM users');
    const totalPages = Math.ceil(totalCount.count / limit);

    res.json({
      users,
      pagination: {
        current_page: page,
        total_pages: totalPages,
        total_users: totalCount.count,
        limit,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


router.delete('/:userId', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const userId = req.params.userId;
    const adminId = req.user.id; // The admin making the request
    
    // Validate userId is a number
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }

    const userIdInt = parseInt(userId);

    // Prevent admin from deleting themselves
    if (userIdInt === adminId) {
      return res.status(400).json({ 
        error: 'Cannot delete your own account',
        details: 'Please ask another admin to delete your account if needed.'
      });
    }

    // Check if user exists and get their role
    const user = await dbGet(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [userIdInt]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`Starting deletion process for user: ${user.name} (${user.role})`);

    // Get user profile to check for profile picture
    const profile = await dbGet(
      'SELECT profile_picture_url FROM user_profiles WHERE user_id = ?',
      [userIdInt]
    );

    // Delete profile picture file if exists
    if (profile?.profile_picture_url) {
      const imagePath = path.join(__dirname, '..', profile.profile_picture_url);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
          console.log('Deleted profile picture:', imagePath);
        } catch (fileErr) {
          console.error('Error deleting profile picture:', fileErr);
        }
      }
    }

    // ========================================
    // ROLE-SPECIFIC DELETION LOGIC
    // ========================================

    if (user.role === 'organizer') {
      console.log('User is an organizer - deleting their events');

      // Get all events organized by this user
      const events = await dbAll(
        'SELECT id, title FROM events WHERE organizer_id = ?',
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
          'SELECT id, image_url FROM recycling_logs WHERE event_id = ?',
          [event.id]
        );

        console.log(`Event "${event.title}" has ${recyclingLogs.length} recycling logs`);

        // Delete recycling log images
        for (const log of recyclingLogs) {
          if (log.image_url) {
            const imagePath = path.join(__dirname, '..', log.image_url);
            if (fs.existsSync(imagePath)) {
              try {
                fs.unlinkSync(imagePath);
                console.log('Deleted recycling log image:', imagePath);
              } catch (fileErr) {
                console.error('Error deleting recycling image:', fileErr);
              }
            }
          }
        }

        // IMPORTANT: We keep recycling logs but set event_id to NULL
        // This preserves students' records and eco points
        await dbRun(
          'UPDATE recycling_logs SET event_id = NULL WHERE event_id = ?',
          [event.id]
        );

        console.log(`Updated recycling logs for event "${event.title}" - set event_id to NULL`);

        // Delete the event (this will cascade to event_participants and event_announcements)
        await dbRun('DELETE FROM events WHERE id = ?', [event.id]);
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
            'Event Cancelled',
            `The event "${participant.title}" has been cancelled as the organizer account was removed.`,
            'system'
          ]
        );
      }
    }

    // ========================================
    // DELETE USER'S OWN RECYCLING LOGS
    // ========================================
    // (For students, volunteers, or organizers who submitted logs)
    
    const userRecyclingLogs = await dbAll(
      'SELECT id, image_url FROM recycling_logs WHERE user_id = ?',
      [userIdInt]
    );

    console.log(`User has ${userRecyclingLogs.length} recycling logs`);

    // Delete recycling log images
    for (const log of userRecyclingLogs) {
      if (log.image_url) {
        const imagePath = path.join(__dirname, '..', log.image_url);
        if (fs.existsSync(imagePath)) {
          try {
            fs.unlinkSync(imagePath);
            console.log('Deleted user recycling log image:', imagePath);
          } catch (fileErr) {
            console.error('Error deleting user recycling image:', fileErr);
          }
        }
      }
    }

    // Delete user's recycling logs
    await dbRun('DELETE FROM recycling_logs WHERE user_id = ?', [userIdInt]);

    // ========================================
    // DELETE OTHER ASSOCIATED DATA
    // ========================================

    // Delete from user_profiles (CASCADE should handle, but explicit is safer)
    await dbRun('DELETE FROM user_profiles WHERE user_id = ?', [userIdInt]);

    // Delete from event_participants (CASCADE should handle)
    await dbRun('DELETE FROM event_participants WHERE user_id = ?', [userIdInt]);

    // Delete from notifications (CASCADE should handle)
    await dbRun('DELETE FROM notifications WHERE user_id = ?', [userIdInt]);

    // Delete from user_achievements (CASCADE should handle)
    await dbRun('DELETE FROM user_achievements WHERE user_id = ?', [userIdInt]);

    // Handle event_announcements where user was creator
    // Set created_by to NULL instead of deleting announcements
    await dbRun(
      'UPDATE event_announcements SET created_by = NULL WHERE created_by = ?',
      [userIdInt]
    );

    // Handle recycling_logs where user was verifier
    // Set verified_by to NULL instead of deleting logs
    await dbRun(
      'UPDATE recycling_logs SET verified_by = NULL WHERE verified_by = ?',
      [userIdInt]
    );

    // ========================================
    // FINALLY DELETE THE USER ACCOUNT
    // ========================================
    await dbRun('DELETE FROM users WHERE id = ?', [userIdInt]);

    console.log(`User deleted: ${user.name} (${user.email}) by admin ID: ${adminId}`);

    // Summary of what was deleted
    const summary = {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      deletedData: {
        profile: true,
        recyclingLogs: userRecyclingLogs.length,
        notifications: true,
        achievements: true,
        eventParticipations: true
      }
    };

    if (user.role === 'organizer') {
      summary.deletedData.events = events.length;
      summary.note = 'Recycling logs from deleted events were preserved but disassociated from events';
    }

    res.json({
      message: 'User and associated data deleted successfully',
      summary
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      error: 'Server error',
      details: error.message 
    });
  }
});

export default router;