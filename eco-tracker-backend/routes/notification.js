import express from 'express';
import db from '../database/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications for the logged-in user
router.get('/', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT id, title, message, type, read, created_at
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;
  
  db.all(query, [userId], (err, notifications) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ notifications });
  });
});

// Get unread notification count
router.get('/unread-count', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const query = `
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = ? AND read = 0
  `;
  
  db.get(query, [userId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ unreadCount: result.count });
  });
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const query = `
    UPDATE notifications
    SET read = 1
    WHERE id = ? AND user_id = ?
  `;
  
  db.run(query, [notificationId, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification marked as read' });
  });
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  const query = `
    UPDATE notifications
    SET read = 1
    WHERE user_id = ? AND read = 0
  `;
  
  db.run(query, [userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ 
      message: 'All notifications marked as read',
      updatedCount: this.changes 
    });
  });
});

// Send notification to event participants (Organizer only)
router.post('/event/:eventId', authenticateToken, authorizeRoles('organizer'), (req, res) => {
  const { eventId } = req.params;
  const { title, message } = req.body;
  const organizerId = req.user.id;
  
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }
  
  // First verify the organizer owns this event
  const verifyQuery = `
    SELECT id, title
    FROM events
    WHERE id = ? AND organizer_id = ?
  `;
  
  db.get(verifyQuery, [eventId, organizerId], (err, event) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!event) {
      return res.status(403).json({ error: 'You can only send notifications for your own events' });
    }
    
    // Get all participants for this event
    const participantsQuery = `
      SELECT DISTINCT user_id
      FROM event_participants
      WHERE event_id = ?
    `;
    
    db.all(participantsQuery, [eventId], (err, participants) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (participants.length === 0) {
        return res.status(404).json({ error: 'No participants found for this event' });
      }
      
      // Insert notification for each participant
      const insertQuery = `
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, 'event')
      `;
      
      const stmt = db.prepare(insertQuery);
      let successCount = 0;
      let errorOccurred = false;
      
      participants.forEach((participant, index) => {
        stmt.run([participant.user_id, title, message], (err) => {
          if (err && !errorOccurred) {
            errorOccurred = true;
            stmt.finalize();
            return res.status(500).json({ error: 'Failed to send notifications' });
          }
          
          successCount++;
          
          // If this is the last participant and no errors occurred
          if (index === participants.length - 1 && !errorOccurred) {
            stmt.finalize();
            res.json({ 
              message: `Notification sent to ${successCount} participant(s)`,
              recipientCount: successCount 
            });
          }
        });
      });
    });
  });
});

// Send notification to all users (Admin only)
router.post('/all', authenticateToken, authorizeRoles('admin'), (req, res) => {
  const { title, message, type } = req.body;
  
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }
  
  const notificationType = type || 'admin';
  
  // Get all users except the admin sending the notification
  const usersQuery = `
    SELECT id
    FROM users
    WHERE id != ?
  `;
  
  db.all(usersQuery, [req.user.id], (err, users) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (users.length === 0) {
      return res.status(404).json({ error: 'No users found' });
    }
    
    // Insert notification for each user
    const insertQuery = `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `;
    
    const stmt = db.prepare(insertQuery);
    let successCount = 0;
    let errorOccurred = false;
    
    users.forEach((user, index) => {
      stmt.run([user.id, title, message, notificationType], (err) => {
        if (err && !errorOccurred) {
          errorOccurred = true;
          stmt.finalize();
          return res.status(500).json({ error: 'Failed to send notifications' });
        }
        
        successCount++;
        
        // If this is the last user and no errors occurred
        if (index === users.length - 1 && !errorOccurred) {
          stmt.finalize();
          res.json({ 
            message: `Notification sent to ${successCount} user(s)`,
            recipientCount: successCount 
          });
        }
      });
    });
  });
});

// Delete a notification
router.delete('/:id', authenticateToken, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.user.id;
  
  const query = `
    DELETE FROM notifications
    WHERE id = ? AND user_id = ?
  `;
  
  db.run(query, [notificationId, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  });
});

export default router;
