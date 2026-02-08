import express from 'express';
import { dbGet, dbAll } from '../database/db.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard-stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Get total waste collected from recycling logs
    const wasteStats = await dbGet(
      `SELECT 
        COALESCE(SUM(weight), 0) as total_weight,
        COUNT(DISTINCT user_id) as active_users,
        COUNT(*) as total_logs
       FROM recycling_logs
       WHERE verified = 1`
    );

    // Get events this month
    const eventsThisMonth = await dbGet(
      `SELECT COUNT(*) as event_count
       FROM events
       WHERE strftime('%Y-%m', event_date) = strftime('%Y-%m', 'now')`
    );

    // Get total registered users (students who participated)
    const participantStats = await dbGet(
      `SELECT COUNT(DISTINCT user_id) as total_participants
       FROM event_participants`
    );

    res.json({
      total_waste_collected: parseFloat(wasteStats.total_weight || 0).toFixed(2),
      active_users: wasteStats.active_users || 0,
      total_logs: wasteStats.total_logs || 0,
      events_this_month: eventsThisMonth.event_count || 0,
      total_participants: participantStats.total_participants || 0
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Generate report based on type and date range
router.post('/generate', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { report_type, start_date, end_date } = req.body;

    if (!report_type || !start_date || !end_date) {
      return res.status(400).json({ 
        error: 'Report type, start date, and end date are required' 
      });
    }

    let reportData = {};

    switch (report_type) {
      case 'Monthly Waste Collection Summary':
        reportData = await generateWasteCollectionReport(start_date, end_date);
        break;

      case 'User Activity Report':
        reportData = await generateUserActivityReport(start_date, end_date);
        break;

      case 'Event Participation Report':
        reportData = await generateEventParticipationReport(start_date, end_date);
        break;

      case 'Recycling Type Breakdown':
        reportData = await generateRecyclingTypeBreakdown(start_date, end_date);
        break;

      case 'Eco-Points Distribution Report':
        reportData = await generateEcoPointsReport(start_date, end_date);
        break;

      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    res.json({
      report_type,
      start_date,
      end_date,
      generated_at: new Date().toISOString(),
      data: reportData
    });

  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Report Generation Functions

async function generateWasteCollectionReport(startDate, endDate) {
  // Total waste collected
  const totalWaste = await dbGet(
    `SELECT 
      COALESCE(SUM(weight), 0) as total_weight,
      COUNT(*) as total_logs,
      COUNT(DISTINCT user_id) as unique_users
     FROM recycling_logs
     WHERE created_at BETWEEN ? AND ?
     AND verified = 1`,
    [startDate, endDate]
  );

  // Waste by category
  const wasteByCategory = await dbAll(
    `SELECT 
      category,
      SUM(weight) as total_weight,
      COUNT(*) as log_count,
      ROUND(AVG(weight), 2) as avg_weight
     FROM recycling_logs
     WHERE created_at BETWEEN ? AND ?
     AND verified = 1
     GROUP BY category
     ORDER BY total_weight DESC`,
    [startDate, endDate]
  );

  // Waste by event
  const wasteByEvent = await dbAll(
    `SELECT 
      e.title as event_name,
      e.event_date,
      SUM(rl.weight) as total_weight,
      COUNT(rl.id) as log_count
     FROM recycling_logs rl
     JOIN events e ON rl.event_id = e.id
     WHERE rl.created_at BETWEEN ? AND ?
     AND rl.verified = 1
     GROUP BY e.id
     ORDER BY total_weight DESC`,
    [startDate, endDate]
  );

  // Daily breakdown
  const dailyBreakdown = await dbAll(
    `SELECT 
      DATE(created_at) as date,
      SUM(weight) as total_weight,
      COUNT(*) as log_count
     FROM recycling_logs
     WHERE created_at BETWEEN ? AND ?
     AND verified = 1
     GROUP BY DATE(created_at)
     ORDER BY date`,
    [startDate, endDate]
  );

  return {
    summary: {
      total_weight: parseFloat(totalWaste.total_weight || 0).toFixed(2),
      total_logs: totalWaste.total_logs || 0,
      unique_users: totalWaste.unique_users || 0
    },
    by_category: wasteByCategory,
    by_event: wasteByEvent,
    daily_breakdown: dailyBreakdown
  };
}

async function generateUserActivityReport(startDate, endDate) {
  // Most active users
  const topUsers = await dbAll(
    `SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      COUNT(rl.id) as total_submissions,
      SUM(rl.weight) as total_weight,
      SUM(rl.eco_points_earned) as total_points
     FROM users u
     LEFT JOIN recycling_logs rl ON u.id = rl.user_id
     WHERE rl.created_at BETWEEN ? AND ?
     AND rl.verified = 1
     GROUP BY u.id
     ORDER BY total_submissions DESC
     LIMIT 20`,
    [startDate, endDate]
  );

  // User registrations in period
  const newUsers = await dbGet(
    `SELECT COUNT(*) as new_user_count
     FROM users
     WHERE created_at BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  // Activity by role
  const activityByRole = await dbAll(
    `SELECT 
      u.role,
      COUNT(DISTINCT u.id) as user_count,
      COUNT(rl.id) as total_submissions,
      SUM(rl.weight) as total_weight
     FROM users u
     LEFT JOIN recycling_logs rl ON u.id = rl.user_id
     WHERE rl.created_at BETWEEN ? AND ?
     AND rl.verified = 1
     GROUP BY u.role`,
    [startDate, endDate]
  );

  return {
    top_users: topUsers,
    new_users: newUsers.new_user_count || 0,
    activity_by_role: activityByRole
  };
}

async function generateEventParticipationReport(startDate, endDate) {
  // Events in date range
  const events = await dbAll(
    `SELECT 
      e.id,
      e.title,
      e.event_type,
      e.event_date,
      e.location,
      e.status,
      e.max_participants,
      e.eco_points_reward,
      COUNT(DISTINCT ep.user_id) as total_registered,
      SUM(CASE WHEN ep.attended = 1 THEN 1 ELSE 0 END) as total_attended,
      u.name as organizer_name
     FROM events e
     LEFT JOIN event_participants ep ON e.id = ep.event_id
     LEFT JOIN users u ON e.organizer_id = u.id
     WHERE e.event_date BETWEEN ? AND ?
     GROUP BY e.id
     ORDER BY e.event_date DESC`,
    [startDate, endDate]
  );

  // Participation rate
  const participationStats = await dbGet(
    `SELECT 
      COUNT(DISTINCT ep.event_id) as total_events,
      COUNT(*) as total_registrations,
      SUM(CASE WHEN ep.attended = 1 THEN 1 ELSE 0 END) as total_attended
     FROM event_participants ep
     JOIN events e ON ep.event_id = e.id
     WHERE e.event_date BETWEEN ? AND ?`,
    [startDate, endDate]
  );

  return {
    events: events,
    summary: {
      total_events: participationStats.total_events || 0,
      total_registrations: participationStats.total_registrations || 0,
      total_attended: participationStats.total_attended || 0,
      attendance_rate: participationStats.total_registrations > 0 
        ? ((participationStats.total_attended / participationStats.total_registrations) * 100).toFixed(2)
        : 0
    }
  };
}

async function generateRecyclingTypeBreakdown(startDate, endDate) {
  // Breakdown by category
  const categoryBreakdown = await dbAll(
    `SELECT 
      category,
      COUNT(*) as total_logs,
      SUM(weight) as total_weight,
      ROUND(AVG(weight), 2) as avg_weight,
      SUM(eco_points_earned) as total_points,
      COUNT(DISTINCT user_id) as unique_users
     FROM recycling_logs
     WHERE created_at BETWEEN ? AND ?
     AND verified = 1
     GROUP BY category
     ORDER BY total_weight DESC`,
    [startDate, endDate]
  );

  // Calculate percentages
  const totalWeight = categoryBreakdown.reduce((sum, cat) => sum + (cat.total_weight || 0), 0);
  
  const categoryWithPercentages = categoryBreakdown.map(cat => ({
    ...cat,
    percentage: totalWeight > 0 ? ((cat.total_weight / totalWeight) * 100).toFixed(2) : 0
  }));

  return {
    breakdown: categoryWithPercentages,
    total_weight: parseFloat(totalWeight).toFixed(2)
  };
}

async function generateEcoPointsReport(startDate, endDate) {
  // Points distribution
  const pointsDistribution = await dbAll(
    `SELECT 
      u.id,
      u.name,
      u.email,
      u.role,
      u.eco_points as current_points,
      SUM(rl.eco_points_earned) as points_earned_in_period,
      COUNT(rl.id) as logs_in_period
     FROM users u
     LEFT JOIN recycling_logs rl ON u.id = rl.user_id
     WHERE rl.created_at BETWEEN ? AND ?
     AND rl.verified = 1
     GROUP BY u.id
     ORDER BY points_earned_in_period DESC
     LIMIT 50`,
    [startDate, endDate]
  );

  // Total points awarded
  const totalPointsAwarded = await dbGet(
    `SELECT 
      SUM(eco_points_earned) as total_points,
      COUNT(*) as total_logs
     FROM recycling_logs
     WHERE created_at BETWEEN ? AND ?
     AND verified = 1`,
    [startDate, endDate]
  );

  // Points by category
  const pointsByCategory = await dbAll(
    `SELECT 
      category,
      SUM(eco_points_earned) as total_points,
      COUNT(*) as log_count,
      ROUND(AVG(eco_points_earned), 2) as avg_points
     FROM recycling_logs
     WHERE created_at BETWEEN ? AND ?
     AND verified = 1
     GROUP BY category
     ORDER BY total_points DESC`,
    [startDate, endDate]
  );

  return {
    top_earners: pointsDistribution,
    summary: {
      total_points_awarded: totalPointsAwarded.total_points || 0,
      total_logs: totalPointsAwarded.total_logs || 0
    },
    by_category: pointsByCategory
  };
}

export default router;