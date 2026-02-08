import { dbAll, dbGet, dbRun } from "../database/db.js";

let autoApprovalInterval = null;

// Function to auto-approve a single log (EXACT SAME LOGIC AS MANUAL APPROVAL)
const autoApproveRecyclingLog = async (logId, systemUserId = 2) => {
  try {
    // 1. Get the recycling log details
    const log = await dbGet("SELECT * FROM recycling_logs WHERE id = ?", [logId]);
    
    if (!log) {
      return { success: false, reason: 'Log not found' };
    }

    // Check if already verified
    if (log.verified) {
      return { success: false, reason: 'Already verified' };
    }

    // 2. Get eco points from the event
    const event = await dbGet(
      "SELECT eco_points_reward FROM events WHERE id = ?",
      [log.event_id]
    );

    if (!event) {
      console.log(`⚠️ Event ${log.event_id} not found for log ${logId}`);
      return { success: false, reason: 'Event not found' };
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
      [systemUserId, ecoPointsToAward, logId]
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

    // 6. Send notification to user
    await dbRun(
      `INSERT INTO notifications (user_id, title, message, type)
       VALUES (?, ?, ?, ?)`,
      [
        log.user_id,
        'Recycling Log Approved',
        `Your recycling log (${log.category}, ${log.weight}kg) has been automatically approved! You earned ${ecoPointsToAward} eco-points.`,
        'system'
      ]
    );

    return { 
      success: true, 
      logId, 
      ecoPointsAwarded: ecoPointsToAward,
      userId: log.user_id 
    };
  } catch (error) {
    console.error(`❌ Error auto-approving log ${logId}:`, error);
    return { success: false, error: error.message };
  }
};

// Main function to process all pending logs
const processPendingLogs = async () => {
  try {
    const currentTime = new Date().toLocaleTimeString();
    console.log(`\n⏰ [${currentTime}] Auto-approval check started...`);

    // Check if auto-approval is enabled
    const setting = await dbGet(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'auto_approve_logs'"
    );

    if (setting?.setting_value !== 'true') {
      console.log('⏸️  Auto-approval is disabled - skipping');
      return { processed: false, reason: 'disabled' };
    }

    // Get all unverified logs that have an event_id
    const pendingLogs = await dbAll(
      `SELECT id, user_id, category, weight, event_id 
       FROM recycling_logs 
       WHERE verified = 0 
       AND event_id IS NOT NULL`
    );

    if (pendingLogs.length === 0) {
      console.log('✅ No pending logs found');
      return { processed: true, count: 0 };
    }

    console.log(`📋 Found ${pendingLogs.length} pending log(s) - processing...`);

    let successCount = 0;
    let failCount = 0;
    const results = [];

    // Process each pending log
    for (const log of pendingLogs) {
      const result = await autoApproveRecyclingLog(log.id);
      results.push(result);
      
      if (result.success) {
        successCount++;
        console.log(`  ✅ Log ${log.id}: ${result.ecoPointsAwarded} points → User ${log.user_id}`);
      } else {
        failCount++;
        console.log(`  ❌ Log ${log.id}: ${result.reason || 'Failed'}`);
      }
    }

    console.log(`🎉 Complete: ${successCount} approved, ${failCount} failed\n`);

    // Log to system_logs
    if (successCount > 0) {
      await dbRun(
        'INSERT INTO system_logs (action, performed_by, details) VALUES (?, ?, ?)',
        [
          'AUTO_APPROVE_SCHEDULED',
          2, // System/Admin user ID
          `Scheduled check: ${successCount} logs approved, ${failCount} failed`
        ]
      );
    }

    return { 
      processed: true, 
      total: pendingLogs.length,
      approved: successCount, 
      failed: failCount,
      results 
    };
  } catch (error) {
    console.error('❌ Process pending logs error:', error);
    return { processed: false, error: error.message };
  }
};

// Start the scheduler (runs every 10 minutes)
const startAutoApprovalScheduler = () => {
  // Prevent multiple schedulers
  if (autoApprovalInterval) {
    console.log('⚠️  Scheduler already running - stopping old one first');
    stopAutoApprovalScheduler();
  }

  console.log('🚀 Starting auto-approval scheduler');
  console.log('⏰ Will check for pending logs every 10 minutes');

  // Run immediately on start
  processPendingLogs();

  // Schedule to run every 10 minutes (600000 ms)
  autoApprovalInterval = setInterval(() => {
    processPendingLogs();
  }, 2 * 60 * 1000);

  console.log('✅ Scheduler started successfully');
};

// Stop the scheduler
const stopAutoApprovalScheduler = () => {
  if (autoApprovalInterval) {
    clearInterval(autoApprovalInterval);
    autoApprovalInterval = null;
    console.log('🛑 Auto-approval scheduler stopped');
  } else {
    console.log('ℹ️  No active scheduler to stop');
  }
};

// Check if scheduler is running
const isSchedulerRunning = () => {
  return autoApprovalInterval !== null;
};

// Export functions
export { 
  startAutoApprovalScheduler, 
  stopAutoApprovalScheduler, 
  processPendingLogs,
  autoApproveRecyclingLog,
  isSchedulerRunning
};