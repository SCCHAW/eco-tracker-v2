// ========================================
// BACKEND - System Maintenance Routes
// ========================================
// File: routes/system.js

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbAll, dbGet, dbRun } from "../database/db.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import { processPendingLogs, startAutoApprovalScheduler, stopAutoApprovalScheduler } from '../service/autoApprovalService.js';



// ========================================
// GET SYSTEM HEALTH & STATS
// ========================================
router.get('/health', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Check database connectivity
    const dbCheck = await dbGet('SELECT 1 as test');
    const databaseStatus = dbCheck ? 'Healthy' : 'Unhealthy';

    // Get last backup time
    const lastBackupSetting = await dbGet(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'last_backup'"
    );
    const lastBackup = lastBackupSetting?.setting_value || 'Never';

    // Get system stats
    const totalUsers = await dbGet('SELECT COUNT(*) as count FROM users');
    const totalLogs = await dbGet('SELECT COUNT(*) as count FROM recycling_logs');
    const totalEvents = await dbGet('SELECT COUNT(*) as count FROM events');
    const totalWaste = await dbGet('SELECT SUM(weight) as total FROM recycling_logs WHERE verified = 1');

    // // Get disk space (Unix/Linux/Mac only)
    // let diskSpace = 'N/A';
    // try {
    //   const { execSync } = await import('child_process');
    //   const dbPath = path.join(__dirname, '..', 'database');
    //   const output = execSync(`df -h "${dbPath}" | tail -1`).toString();
    //   const parts = output.split(/\s+/);
    //   diskSpace = parts[4]; // Usage percentage
    // } catch (err) {
    //   console.log('Could not get disk space:', err.message);
    // }

    // Get disk space (cross-platform)
let diskSpace = 'N/A';
try {
  const { execSync } = await import('child_process');
  const dbPath = path.join(__dirname, '..', 'database');
  
  const isWindows = process.platform === 'win32';
  
  if (isWindows) {
    // Windows: Use PowerShell
    const drive = path.parse(dbPath).root.replace('\\', ''); // Get drive letter
    const output = execSync(
      `powershell "Get-PSDrive ${drive.charAt(0)} | Select-Object Used,Free | ConvertTo-Json"`,
      { encoding: 'utf8' }
    );
    
    const data = JSON.parse(output);
    const total = data.Used + data.Free;
    const usedPercentage = ((data.Used / total) * 100).toFixed(0);
    diskSpace = `${usedPercentage}%`;
  } else {
    // Unix/Linux/Mac
    const output = execSync(`df -h "${dbPath}" | tail -1`).toString();
    const parts = output.split(/\s+/);
    diskSpace = parts[4]; // Usage percentage
  }
} catch (err) {
  console.log('Could not get disk space:', err.message);
}

    res.json({
      serverStatus: 'Online',
      databaseStatus,
      lastBackup,
      diskSpace,
      stats: {
        totalUsers: totalUsers.count,
        totalLogs: totalLogs.count,
        totalEvents: totalEvents.count,
        totalWaste: totalWaste.total || 0,
      }
    });
  } catch (error) {
    console.error('System health check error:', error);
    res.status(500).json({ 
      error: 'Failed to get system health',
      details: error.message 
    });
  }
});

// ========================================
// GET SYSTEM SETTINGS
// ========================================
router.get('/settings', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const settings = await dbAll('SELECT * FROM system_settings');
    
    // Convert to key-value object
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.setting_key] = {
        value: setting.setting_value === 'true',
        description: setting.description,
        updated_at: setting.updated_at
      };
    });

    res.json({ settings: settingsObj });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ 
      error: 'Failed to get settings',
      details: error.message 
    });
  }
});

// ========================================
// UPDATE SYSTEM SETTING
// =======================================



// ⭐ UPDATED ROUTE - This is what the toggle calls
router.put('/settings/:key', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Convert boolean to string
    const stringValue = String(value);

    // Update setting in database
    await dbRun(
      `UPDATE system_settings 
       SET setting_value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
       WHERE setting_key = ?`,
      [stringValue, req.user.id, key]
    );

    // Log the action
    await dbRun(
      'INSERT INTO system_logs (action, performed_by, details) VALUES (?, ?, ?)',
      ['UPDATE_SETTING', req.user.id, `Changed ${key} to ${stringValue}`]
    );

    // ⭐⭐⭐ SPECIAL HANDLING FOR AUTO-APPROVAL TOGGLE ⭐⭐⭐
    if (key === 'auto_approve_logs') {
      if (stringValue === 'true') {
        console.log('🟢 Auto-approval ENABLED - Starting scheduler...');
        
        // Stop existing scheduler if running
        stopAutoApprovalScheduler();
        
        // Start new scheduler
        startAutoApprovalScheduler();
        
        // Immediately process any pending logs
        console.log('🔄 Processing existing pending logs...');
        await processPendingLogs();
        
      } else {
        console.log('🔴 Auto-approval DISABLED - Stopping scheduler...');
        
        // Stop the scheduler
        stopAutoApprovalScheduler();
      }
    }

    res.json({ 
      message: 'Setting updated successfully',
      key,
      value: stringValue,
      schedulerStatus: key === 'auto_approve_logs' 
        ? (stringValue === 'true' ? 'started' : 'stopped')
        : null
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ 
      error: 'Failed to update setting',
      details: error.message 
    });
  }
});


// ========================================
// RUN DATABASE BACKUP
// ========================================
router.post('/backup', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `eco-tracker-backup-${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    // Source database path (adjust as needed)
    const dbPath = path.join(__dirname, '..', 'database', 'eco_tracker.db');

    // Copy database file
    fs.copyFileSync(dbPath, backupPath);

    // Update last backup time
    await dbRun(
      `UPDATE system_settings 
       SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
       WHERE setting_key = 'last_backup'`,
      [new Date().toISOString()]
    );

    // Log the action
    await dbRun(
      'INSERT INTO system_logs (action, performed_by, details) VALUES (?, ?, ?)',
      ['DATABASE_BACKUP', req.user.id, `Backup created: ${backupFileName}`]
    );

    // Clean up old backups (keep last 10)
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('eco-tracker-backup-'))
      .sort()
      .reverse();

    if (files.length > 10) {
      files.slice(10).forEach(file => {
        fs.unlinkSync(path.join(backupDir, file));
      });
    }

    res.json({
      message: 'Backup created successfully',
      filename: backupFileName,
      path: backupPath,
      size: fs.statSync(backupPath).size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Backup error:', error);
    res.status(500).json({ 
      error: 'Failed to create backup',
      details: error.message 
    });
  }
});

// ========================================
// CLEAR CACHE (Placeholder - implement based on your caching strategy)
// ========================================
router.post('/clear-cache', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Add your cache clearing logic here
    // For example, if using node-cache:
    // cache.flushAll();

    // Log the action
    await dbRun(
      'INSERT INTO system_logs (action, performed_by, details) VALUES (?, ?, ?)',
      ['CLEAR_CACHE', req.user.id, 'System cache cleared']
    );

    res.json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      details: error.message 
    });
  }
});

// ========================================
// EXPORT ALL DATA
// ========================================
router.get('/export', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    // Get all data from all tables
    const users = await dbAll('SELECT id, name, email, role, eco_points, created_at FROM users');
    const recyclingLogs = await dbAll('SELECT * FROM recycling_logs');
    const events = await dbAll('SELECT * FROM events');
    const eventParticipants = await dbAll('SELECT * FROM event_participants');
    const userProfiles = await dbAll('SELECT * FROM user_profiles');

    const exportData = {
      exportDate: new Date().toISOString(),
      exportedBy: req.user.email,
      data: {
        users,
        recyclingLogs,
        events,
        eventParticipants,
        userProfiles,
      },
      stats: {
        totalUsers: users.length,
        totalLogs: recyclingLogs.length,
        totalEvents: events.length,
      }
    };

    // Log the action
    await dbRun(
      'INSERT INTO system_logs (action, performed_by, details) VALUES (?, ?, ?)',
      ['EXPORT_DATA', req.user.id, 'Full data export performed']
    );

    res.json(exportData);
  } catch (error) {
    console.error('Export data error:', error);
    res.status(500).json({ 
      error: 'Failed to export data',
      details: error.message 
    });
  }
});

// ========================================
// GET SYSTEM LOGS
// ========================================
router.get('/logs', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const logs = await dbAll(
      `SELECT 
        sl.*,
        u.name as performed_by_name,
        u.email as performed_by_email
       FROM system_logs sl
       JOIN users u ON sl.performed_by = u.id
       ORDER BY sl.created_at DESC
       LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const total = await dbGet('SELECT COUNT(*) as count FROM system_logs');

    res.json({
      logs,
      pagination: {
        total: total.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
      }
    });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ 
      error: 'Failed to get system logs',
      details: error.message 
    });
  }
});

export default router;