import express from 'express';
import { dbGet, dbAll, dbRun } from '../database/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get all events (with optional filters)
router.get('/', async (req, res) => {
  try {
    const { status, organizer_id, upcoming } = req.query;
    let query = 'SELECT e.*, u.name as organizer_name, u.email as organizer_email FROM events e JOIN users u ON e.organizer_id = u.id WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    if (organizer_id) {
      query += ' AND e.organizer_id = ?';
      params.push(organizer_id);
    }

    if (upcoming === 'true') {
      query += ' AND e.status IN ("upcoming", "ongoing")';
    }

    query += ' ORDER BY e.event_date DESC';

    const events = await dbAll(query, params);

    // Get participant counts for each event
    const eventsWithCounts = await Promise.all(
      events.map(async (event) => {
        const participantCount = await dbGet(
          'SELECT COUNT(*) as count FROM event_participants WHERE event_id = ?',
          [event.id]
        );
        return {
          ...event,
          participant_count: participantCount.count,
          spots_available: event.max_participants ? event.max_participants - participantCount.count : null
        };
      })
    );

    res.json({ events: eventsWithCounts });
  } catch (error) {
    console.error('Events fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single event by ID
router.get('/:id', async (req, res) => {
  try {
    const event = await dbGet(
      `SELECT e.*, u.name as organizer_name, u.email as organizer_email 
       FROM events e 
       JOIN users u ON e.organizer_id = u.id 
       WHERE e.id = ?`,
      [req.params.id]
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Get participants list
    const participants = await dbAll(
      `SELECT u.id, u.name, u.email, ep.attended, ep.registered_at 
       FROM event_participants ep 
       JOIN users u ON ep.user_id = u.id 
       WHERE ep.event_id = ?
       ORDER BY ep.registered_at DESC`,
      [req.params.id]
    );

    res.json({ 
      event: {
        ...event,
        participants,
        participant_count: participants.length,
        spots_available: event.max_participants ? event.max_participants - participants.length : null
      }
    });
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new event (organizers only)
router.post('/', authenticateToken, authorizeRoles('organizer'), async (req, res) => {
  try {
    console.log('📝 Creating event with data:', req.body);
    console.log('👤 User:', req.user);
    
    const {
      title,
      description,
      event_type,
      location,
      event_date,
      event_time,
      max_participants,
      eco_points_reward,
      agenda,
      requirements
    } = req.body;

    // Validation
    if (!title || !event_type || !event_date) {
      return res.status(400).json({ error: 'Title, event type, and event date are required' });
    }

    const validTypes = ['cleanup', 'awareness', 'workshop', 'other'];
    if (!validTypes.includes(event_type)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }

    // Create event
    const result = await dbRun(
      `INSERT INTO events (title, description, event_type, location, event_date, event_time, organizer_id, max_participants, eco_points_reward, agenda, requirements, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        title,
        description,
        event_type,
        location,
        event_date,
        event_time || null,
        req.user.id,
        max_participants || null,
        eco_points_reward || 10,
        agenda || null,
        requirements || null
      ]
    );

    console.log('✅ Event created with ID:', result.id);

    const newEvent = await dbGet('SELECT * FROM events WHERE id = ?', [result.id]);

    res.status(201).json({
      message: 'Event created successfully and pending admin approval',
      event: newEvent
    });
  } catch (error) {
    console.error('❌ Event creation error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
});

// Update event (organizers only)
router.put('/:id', authenticateToken, authorizeRoles('organizer'), async (req, res) => {
  try {
    const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own events' });
    }

    const {
      title,
      description,
      event_type,
      location,
      event_date,
      event_time,
      max_participants,
      eco_points_reward,
      agenda,
      requirements,
      status
    } = req.body;

    // Organizers cannot update pending events (waiting for admin approval)
    if (event.status === 'pending') {
      return res.status(403).json({ error: 'Cannot update event while pending admin approval' });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (event_type !== undefined) {
      const validTypes = ['cleanup', 'awareness', 'workshop', 'other'];
      if (!validTypes.includes(event_type)) {
        return res.status(400).json({ error: 'Invalid event type' });
      }
      updates.push('event_type = ?');
      params.push(event_type);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      params.push(location);
    }
    if (event_date !== undefined) {
      updates.push('event_date = ?');
      params.push(event_date);
    }
    if (event_time !== undefined) {
      updates.push('event_time = ?');
      params.push(event_time);
    }
    if (max_participants !== undefined) {
      updates.push('max_participants = ?');
      params.push(max_participants);
    }
    if (agenda !== undefined) {
      updates.push('agenda = ?');
      params.push(agenda);
    }
    if (requirements !== undefined) {
      updates.push('requirements = ?');
      params.push(requirements);
    }
    if (eco_points_reward !== undefined) {
      updates.push('eco_points_reward = ?');
      params.push(eco_points_reward);
    }
    if (status !== undefined) {
      const validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);
    await dbRun(
      `UPDATE events SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const updatedEvent = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Event update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete event (organizers only)
router.delete('/:id', authenticateToken, authorizeRoles('organizer'), async (req, res) => {
  try {
    const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own events' });
    }

    // Cannot delete pending events (must wait for admin decision)
    if (event.status === 'pending') {
      return res.status(403).json({ error: 'Cannot delete event while pending admin approval' });
    }

    await dbRun('DELETE FROM events WHERE id = ?', [req.params.id]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Event deletion error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Register for an event
router.post('/:id/register', authenticateToken, async (req, res) => {
  try {
    const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot register for cancelled event' });
    }

    if (event.status === 'completed') {
      return res.status(400).json({ error: 'Cannot register for completed event' });
    }

    // Check if event is full
    if (event.max_participants) {
      const participantCount = await dbGet(
        'SELECT COUNT(*) as count FROM event_participants WHERE event_id = ?',
        [req.params.id]
      );
      if (participantCount.count >= event.max_participants) {
        return res.status(400).json({ error: 'Event is full' });
      }
    }

    // Check if already registered
    const existing = await dbGet(
      'SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (existing) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    await dbRun(
      'INSERT INTO event_participants (event_id, user_id) VALUES (?, ?)',
      [req.params.id, req.user.id]
    );

    // Check for stored announcements and send them to the new participant
    const announcements = await dbAll(
      'SELECT * FROM event_announcements WHERE event_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    if (announcements && announcements.length > 0) {
      // Send all stored announcements to the new participant
      for (const announcement of announcements) {
        await dbRun(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [req.user.id, announcement.title, announcement.message, 'event']
        );
      }
    }

    res.status(201).json({ 
      message: 'Successfully registered for event',
      announcementsReceived: announcements ? announcements.length : 0
    });
  } catch (error) {
    console.error('Event registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Unregister from an event
router.delete('/:id/register', authenticateToken, async (req, res) => {
  try {
    const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const participation = await dbGet(
      'SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!participation) {
      return res.status(400).json({ error: 'Not registered for this event' });
    }

    if (participation.attended) {
      return res.status(400).json({ error: 'Cannot unregister from attended event' });
    }

    await dbRun(
      'DELETE FROM event_participants WHERE event_id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({ message: 'Successfully unregistered from event' });
  } catch (error) {
    console.error('Event unregistration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark attendance (organizers only)
router.post('/:id/attendance', authenticateToken, authorizeRoles('organizer'), async (req, res) => {
  try {
    const { user_id, attended } = req.body;

    if (!user_id || attended === undefined) {
      return res.status(400).json({ error: 'User ID and attended status are required' });
    }

    const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only the event organizer can mark attendance' });
    }

    const participation = await dbGet(
      'SELECT * FROM event_participants WHERE event_id = ? AND user_id = ?',
      [req.params.id, user_id]
    );

    if (!participation) {
      return res.status(404).json({ error: 'User not registered for this event' });
    }

    await dbRun(
      'UPDATE event_participants SET attended = ? WHERE event_id = ? AND user_id = ?',
      [attended ? 1 : 0, req.params.id, user_id]
    );

    // Award eco points if marking as attended
    if (attended && !participation.attended) {
      await dbRun(
        'UPDATE users SET eco_points = eco_points + ? WHERE id = ?',
        [event.eco_points_reward, user_id]
      );
    }
    // Remove eco points if unmarking attendance
    else if (!attended && participation.attended) {
      await dbRun(
        'UPDATE users SET eco_points = eco_points - ? WHERE id = ?',
        [event.eco_points_reward, user_id]
      );
    }

    res.json({ message: 'Attendance updated successfully' });
  } catch (error) {
    console.error('Attendance update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin approve or cancel event (admins only)
router.patch('/:id/admin-action', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { action } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const validActions = ['approve', 'cancel'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "approve" or "cancel"' });
    }

    const event = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Admins can only approve or cancel pending events
    if (event.status !== 'pending') {
      return res.status(400).json({ error: 'Can only approve or cancel pending events' });
    }

    let newStatus;
    if (action === 'approve') {
      // Approve: event becomes upcoming and organizer can run it
      newStatus = 'upcoming';
    } else if (action === 'cancel') {
      // Cancel: event will not be run
      newStatus = 'cancelled';
    }

    await dbRun(
      'UPDATE events SET status = ? WHERE id = ?',
      [newStatus, req.params.id]
    );

    const updatedEvent = await dbGet('SELECT * FROM events WHERE id = ?', [req.params.id]);

    res.json({
      message: `Event ${action}d successfully`,
      event: updatedEvent
    });
  } catch (error) {
    console.error('Admin action error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's registered events
router.get('/user/registered', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all registered events with their recycling log status
    const events = await dbAll(
      `SELECT e.*, 
              u.name as organizer_name, 
              ep.attended, 
              ep.registered_at,
              rl.id as recycling_log_id,
              rl.verified as log_verified,
              rl.verified_by,
              rl.verified_at
       FROM events e
       JOIN event_participants ep ON e.id = ep.event_id
       JOIN users u ON e.organizer_id = u.id
       LEFT JOIN recycling_logs rl ON e.id = rl.event_id 
                                   AND rl.user_id = ?
                                   AND rl.verified = 1
       WHERE ep.user_id = ?
       ORDER BY e.event_date DESC`,
      [userId, userId]
    );

    // Filter out events where user has already submitted AND verified recycling logs
    const filteredEvents = events.filter(event => {
      // Keep event in list if:
      // 1. No recycling log exists for this event (recycling_log_id is null), OR
      // 2. Recycling log exists but is not yet verified (log_verified is 0 or null)
      return !event.recycling_log_id || !event.log_verified;
    });

    // Clean up the response - remove recycling log fields since they're just for filtering
    const cleanedEvents = filteredEvents.map(event => {
      const { recycling_log_id, log_verified, verified_by, verified_at, ...eventData } = event;
      return eventData;
    });

    res.json({ events: cleanedEvents });
  } catch (error) {
    console.error('User events fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Get events organized by user (organizers only)
router.get('/user/organized', authenticateToken, authorizeRoles('organizer', 'admin'), async (req, res) => {
  try {
    const events = await dbAll(
      `SELECT e.*,
       (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count
       FROM events e
       WHERE e.organizer_id = ?
       ORDER BY e.event_date DESC`,
      [req.user.id]
    );

    res.json({ events });
  } catch (error) {
    console.error('Organized events fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
