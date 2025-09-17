const express = require('express');
const router = express.Router();

router.get('/mail/test', async (req, res) => {
  try {
    const { testConnection } = require('../mail');
    const isConnected = await testConnection();
    if (isConnected) {
      res.json({ success: true, message: 'Email service is working properly', timestamp: new Date().toISOString() });
    } else {
      res.status(503).json({ success: false, message: 'Email service is not available', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Email service test failed', error: error.message, timestamp: new Date().toISOString() });
  }
});

router.post('/mail/test-send', async (req, res) => {
  try {
    const { sendTestEmail } = require('../mail');
    const { email = 'test@example.com' } = req.body;
    const result = await sendTestEmail(email);
    if (result.success) {
      res.json({ success: true, message: 'Test email sent successfully', messageId: result.messageId, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send test email', error: result.error, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Test email failed', error: error.message, timestamp: new Date().toISOString() });
  }
});

router.post('/mail/send', async (req, res) => {
  try {
    const {
      sendVerificationEmail,
      sendWelcomeEmail,
      sendPasswordResetEmail,
      sendLowCreditsEmail,
      sendTeamInvitationEmail,
      sendContactFormEmail,
      sendSupportTicketEmail,
      sendSubscriptionConfirmationEmail
    } = require('../mail');

    const { type, to, name, data } = req.body;
    if (!type || !to || !name) return res.status(400).json({ success: false, message: 'Type, to, and name are required' });

    let result;
    switch (type) {
      case 'verification': result = await sendVerificationEmail(to, name, data.code); break;
      case 'welcome': result = await sendWelcomeEmail(to, name, data.apiKey); break;
      case 'password-reset': result = await sendPasswordResetEmail(to, name, data.token); break;
      case 'low-credits': result = await sendLowCreditsEmail(to, name, data.remainingCredits, data.plan); break;
      case 'team-invitation': result = await sendTeamInvitationEmail(to, data.inviterName, data.inviterEmail, data.invitationLink); break;
      case 'contact': result = await sendContactFormEmail(name, to, data.subject, data.message); break;
      case 'support-ticket': result = await sendSupportTicketEmail(to, name, data.ticketId, data.subject, data.message); break;
      case 'subscription': result = await sendSubscriptionConfirmationEmail(to, name, data.planName, data.amount); break;
      default: return res.status(400).json({ success: false, message: 'Invalid email type' });
    }

    if (result.success) {
      res.json({ success: true, message: 'Email sent successfully', messageId: result.messageId, timestamp: new Date().toISOString() });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email', error: result.error, timestamp: new Date().toISOString() });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Email sending failed', error: error.message, timestamp: new Date().toISOString() });
  }
});

router.get('/mail/health', async (req, res) => {
  try {
    const { testConnection } = require('../mail');
    const isConnected = await testConnection();
    res.json({
      service: 'email',
      status: isConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      provider: 'Amazon SES',
      host: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com'
    });
  } catch (error) {
    res.status(503).json({ service: 'email', status: 'error', error: error.message, timestamp: new Date().toISOString() });
  }
});

module.exports = router;
