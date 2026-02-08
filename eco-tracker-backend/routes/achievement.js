import express from 'express';
import { dbGet, dbAll } from '../database/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user achievements
router.get('/my-achievements', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. ECO WARRIOR - Count attended events (verified logs)
    const ecoWarriorStats = await dbGet(
      `SELECT COUNT(DISTINCT event_id) as attended_events
       FROM recycling_logs
       WHERE user_id = ? 
       AND verified = 1 
       AND event_id IS NOT NULL`,
      [userId]
    );

    const attendedEvents = ecoWarriorStats.attended_events || 0;

    // 2. TREE HUGGER - Trees planted (2 trees per verified log)
    const treeHuggerStats = await dbGet(
      `SELECT COUNT(*) as verified_logs
       FROM recycling_logs
       WHERE user_id = ? 
       AND verified = 1`,
      [userId]
    );

    const verifiedLogs = treeHuggerStats.verified_logs || 0;
    const treesPlanted = verifiedLogs * 2;

    // 3. CLEANUP CHAMPION - Cleanup events participated (via recycling logs)
    const cleanupChampionStats = await dbGet(
      `SELECT COUNT(DISTINCT rl.event_id) as cleanup_events
       FROM recycling_logs rl
       JOIN events e ON rl.event_id = e.id
       WHERE rl.user_id = ? 
       AND rl.verified = 1
       AND e.event_type = 'cleanup'`,
      [userId]
    );

    const cleanupEvents = cleanupChampionStats.cleanup_events || 0;

    // 4. RECYCLING MASTER - Total weight recycled
    const recyclingMasterStats = await dbGet(
      `SELECT COALESCE(SUM(weight), 0) as total_weight
       FROM recycling_logs
       WHERE user_id = ? 
       AND verified = 1`,
      [userId]
    );

    const totalWeight = parseFloat(recyclingMasterStats.total_weight || 0);

    // 5. POINT COLLECTOR - Total eco points
    const pointCollectorStats = await dbGet(
      `SELECT eco_points
       FROM users
       WHERE id = ?`,
      [userId]
    );

    const totalPoints = pointCollectorStats.eco_points || 0;

    // 6. COMMUNITY LEADER - Events organized (for organizers)
    const communityLeaderStats = await dbGet(
      `SELECT COUNT(*) as events_organized
       FROM events
       WHERE organizer_id = ? 
       AND status = 'completed'`,
      [userId]
    );

    const eventsOrganized = communityLeaderStats.events_organized || 0;

    res.json({
      achievements: {
        eco_warrior: {
          title: "Eco Warrior",
          description: "Participated in environmental events",
          icon: "🌍",
          count: attendedEvents,
          progress: attendedEvents,
          goal: 10,
          unlocked: attendedEvents >= 5,
          nextLevel: attendedEvents >= 10 ? "Expert" : attendedEvents >= 5 ? "Advanced" : "Beginner"
        },
        tree_hugger: {
          title: "Tree Hugger",
          description: "Trees planted through recycling",
          icon: "🌳",
          count: treesPlanted,
          progress: treesPlanted,
          goal: 20,
          unlocked: treesPlanted >= 10,
          nextLevel: treesPlanted >= 20 ? "Expert" : treesPlanted >= 10 ? "Advanced" : "Beginner"
        },
        cleanup_champion: {
          title: "Cleanup Champion",
          description: "Participated in cleanup events",
          icon: "🧹",
          count: cleanupEvents,
          progress: cleanupEvents,
          goal: 5,
          unlocked: cleanupEvents >= 3,
          nextLevel: cleanupEvents >= 5 ? "Expert" : cleanupEvents >= 3 ? "Advanced" : "Beginner"
        },
        recycling_master: {
          title: "Recycling Master",
          description: "Total waste recycled",
          icon: "♻️",
          count: totalWeight,
          unit: "kg",
          progress: totalWeight,
          goal: 100,
          unlocked: totalWeight >= 50,
          nextLevel: totalWeight >= 100 ? "Expert" : totalWeight >= 50 ? "Advanced" : "Beginner"
        },
        point_collector: {
          title: "Point Collector",
          description: "Eco-points earned",
          icon: "⭐",
          count: totalPoints,
          progress: totalPoints,
          goal: 500,
          unlocked: totalPoints >= 100,
          nextLevel: totalPoints >= 500 ? "Expert" : totalPoints >= 100 ? "Advanced" : "Beginner"
        },
        community_leader: {
          title: "Community Leader",
          description: "Events organized",
          icon: "👑",
          count: eventsOrganized,
          progress: eventsOrganized,
          goal: 5,
          unlocked: eventsOrganized >= 1,
          nextLevel: eventsOrganized >= 5 ? "Expert" : eventsOrganized >= 1 ? "Advanced" : "Beginner"
        }
      },
      summary: {
        total_achievements: 6,
        unlocked_achievements: [
          attendedEvents >= 5,
          treesPlanted >= 10,
          cleanupEvents >= 3,
          totalWeight >= 50,
          totalPoints >= 100,
          eventsOrganized >= 1
        ].filter(Boolean).length
      }
    });

  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;