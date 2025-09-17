const express = require('express');
const router = express.Router();
const backupSystem = require('../backup-system');
const monitoring = require('../monitoring-system');
const { errorTracker } = require('../error-tracking');
const { checkLowCredits } = require('../crons/low-credits');

// Uptime Robot config (admin only)
router.get('/admin/monitoring/config', (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-2024') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const config = monitoring.getUptimeRobotConfig();
    res.json({ success: true, config, message: 'Use this configuration to setup Uptime Robot monitors' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get monitoring config', error: error.message });
  }
});

// Manual low credits check (admin only)
router.post('/admin/check-low-credits', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-2024') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    await checkLowCredits();
    res.json({ success: true, message: 'Low credits check completed', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Manual credit check error:', error);
    res.status(500).json({ success: false, message: 'Failed to check low credits', error: error.message });
  }
});

// Backup: create
router.post('/admin/backup/create', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-2024') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const backupPath = await backupSystem.createManualBackup('manual');
    res.json({ success: true, message: 'Manual backup created successfully', backupPath, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Manual backup error:', error);
    res.status(500).json({ success: false, message: 'Failed to create backup', error: error.message });
  }
});

// Backup: list
router.get('/admin/backup/list', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-2024') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const backups = backupSystem.getBackupList();
    res.json({ success: true, backups, total: backups.length });
  } catch (error) {
    console.error('Backup list error:', error);
    res.status(500).json({ success: false, message: 'Failed to get backup list', error: error.message });
  }
});

// Backup: restore
router.post('/admin/backup/restore', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-2024') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { backupFilename } = req.body;
    if (!backupFilename) return res.status(400).json({ message: 'Backup filename required' });
    await backupSystem.restoreFromBackup(backupFilename);
    res.json({ success: true, message: 'Database restored successfully', backupFilename, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Backup restore error:', error);
    res.status(500).json({ success: false, message: 'Failed to restore backup', error: error.message });
  }
});

// Admin: error stats
router.get('/admin/errors/stats', async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-key'];
    if (adminKey !== process.env.ADMIN_KEY && adminKey !== 'dev-admin-key-2024') {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const hours = parseInt(req.query.hours) || 24;
    const stats = errorTracker.getErrorStats(hours);
    res.json({ success: true, stats, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error stats failed:', error);
    res.status(500).json({ success: false, message: 'Failed to get error stats', error: error.message });
  }
});

module.exports = router;
