const express = require('express');
const router = express.Router();
const { sendContactFormEmail } = require('../mail');
const { logger } = require('../logger');

router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) return res.status(400).json({ success:false, message:'All fields are required' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success:false, message:'Please provide a valid email address' });
    await sendContactFormEmail(name, email, subject, message);
    logger.info('Contact form submitted', { name, email, subject, messageLength: message.length });
    res.json({ success:true, message: 'Thank you for your message! We\'ll get back to you within 24 hours.' });
  } catch (error) {
    console.error('Contact form error:', error);
    logger.error('Contact form submission failed', { error: error.message });
    res.status(500).json({ success:false, message:'Failed to send message. Please try again later.' });
  }
});
module.exports = router;
