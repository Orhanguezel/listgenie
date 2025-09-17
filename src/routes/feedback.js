const express = require('express');
const router = express.Router();
const multer = require('multer');
const { sendFeedbackEmail } = require('../mail');
const { logger } = require('../logger');

const feedbackUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 }
});

router.post('/feedback', feedbackUpload.array('attachments', 3), async (req, res) => {
  try {
    const { name, email, type, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email and message are required' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }
    const attachments = (req.files || []).map(f => ({ filename: f.originalname, content: f.buffer, contentType: f.mimetype }));
    await sendFeedbackEmail(name, email, type, message, attachments);
    logger.info('Feedback submitted', {
      name, email, type: type || 'General', hasAttachments: attachments.length > 0, ip: req.ip, userAgent: req.get('User-Agent')
    });
    res.json({ success: true, message: 'Thanks! Your feedback has been sent.' });
  } catch (error) {
    logger.error('Feedback submission failed', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, message: 'Failed to send feedback. Please try again later.' });
  }
});

module.exports = router;
