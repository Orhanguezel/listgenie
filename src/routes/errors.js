const express = require('express');
const router = express.Router();
const { errorTracker, browserErrorTracker } = require('../error-tracking');

// Error reporting endpoint
router.post('/errors/report', async (req, res) => {
  try {
    const errorData = req.body;
    const context = {
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      url: errorData.url || req.url
    };
    const error = new Error(errorData.message || 'Browser error');
    error.name = errorData.type || 'BrowserError';
    error.stack = errorData.stack;
    errorTracker.logError(error, { ...context, ...errorData });
    res.json({ success: true, message: 'Error reported' });
  } catch (error) {
    console.error('Error reporting failed:', error);
    res.status(500).json({ success: false, message: 'Failed to report error' });
  }
});

// Browser error tracking script
router.get('/js/error-tracker.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.send(browserErrorTracker);
});

module.exports = router;
