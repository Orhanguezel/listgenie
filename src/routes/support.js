const express = require('express');
const router = express.Router();
const { prisma } = require('../database/prisma');
const { verifyJWT } = require('../utils/jwt-security');
const { sendSupportTicketEmail } = require('../mail');

// Get user support tickets
router.get('/support/tickets', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    console.log('Fetching tickets for user:', decoded.userId);

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, userId: true, subject: true, message: true, priority: true,
        status: true, createdAt: true, updatedAt: true, adminResponse: true,
        responseAt: true, respondedBy: true, assignedTo: true
      }
    });

    console.log('Found tickets:', tickets.length);
    res.json(tickets);
  } catch (error) {
    console.error('Get support tickets error:', error);
    res.status(500).json({ message: 'Failed to get support tickets' });
  }
});

// Create support ticket
router.post('/support/tickets', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    const { subject, message, priority = 'normal' } = req.body;
    if (!subject || !message) return res.status(400).json({ message: 'Subject and message are required' });

    const ticket = await prisma.supportTicket.create({
      data: { userId: decoded.userId, subject, message, priority, status: 'open' }
    });

    res.json(ticket);
  } catch (error) {
    console.error('Create support ticket error:', error);
    res.status(500).json({ message: 'Failed to create support ticket' });
  }
});

// Admin: ticket stats
router.get('/admin/tickets/stats', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, role: true }
    });
    const isAdmin = adminUser && (
      adminUser.email === 'info@listsgenie.com' ||
      adminUser.email === 'admin@listsgenie.com' ||
      adminUser.role === 'admin'
    );
    if (!isAdmin) return res.status(403).json({ message: 'Access denied. Admin only.' });

    const stats = await Promise.all([
      prisma.supportTicket.count({ where: { status: 'open' } }),
      prisma.supportTicket.count({ where: { status: 'in_progress' } }),
      prisma.supportTicket.count({ where: { status: 'closed' } }),
      prisma.supportTicket.count({ where: { priority: 'high' } }),
      prisma.supportTicket.count()
    ]);

    res.json({ open: stats[0], in_progress: stats[1], closed: stats[2], high_priority: stats[3], total: stats[4] });
  } catch (error) {
    console.error('Get admin ticket stats error:', error);
    res.status(500).json({ message: 'Failed to get ticket stats' });
  }
});

// Admin: list tickets
router.get('/admin/tickets', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, role: true }
    });
    const isAdmin = adminUser && (
      adminUser.email === 'info@listsgenie.com' ||
      adminUser.email === 'admin@listsgenie.com' ||
      adminUser.role === 'admin'
    );
    if (!isAdmin) return res.status(403).json({ message: 'Access denied. Admin only.' });

    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const whereClause = status ? { status } : {};

    const tickets = await prisma.supportTicket.findMany({
      where: whereClause,
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    res.json(tickets);
  } catch (error) {
    console.error('Get admin tickets error:', error);
    res.status(500).json({ message: 'Failed to get tickets' });
  }
});

// Admin: update ticket
router.put('/admin/tickets/:ticketId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, role: true }
    });
    const isAdmin = adminUser && (
      adminUser.email === 'info@listsgenie.com' ||
      adminUser.email === 'admin@listsgenie.com' ||
      adminUser.role === 'admin'
    );
    if (!isAdmin) return res.status(403).json({ message: 'Access denied. Admin only.' });

    const { ticketId } = req.params;
    const { status, assignedTo } = req.body;

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status, assignedTo, updatedAt: new Date() }
    });

    res.json(ticket);
  } catch (error) {
    console.error('Update admin ticket error:', error);
    res.status(500).json({ message: 'Failed to update ticket' });
  }
});

// Admin: single ticket
router.get('/admin/tickets/:ticketId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, role: true }
    });
    const isAdmin = adminUser && (
      adminUser.email === 'info@listsgenie.com' ||
      adminUser.email === 'admin@listsgenie.com' ||
      adminUser.role === 'admin'
    );
    if (!isAdmin) return res.status(403).json({ message: 'Access denied. Admin only.' });

    const { ticketId } = req.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { firstName: true, lastName: true, email: true, plan: true } } }
    });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    res.json(ticket);
  } catch (error) {
    console.error('Get admin ticket details error:', error);
    res.status(500).json({ message: 'Failed to get ticket details' });
  }
});

// Admin: respond to ticket (email + resolve)
router.post('/admin/tickets/:ticketId/response', async (req, res) => {
  console.log('📝 Admin ticket response request received');
  console.log('📝 Ticket ID:', req.params.ticketId);
  console.log('📝 Request body:', req.body);

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) { console.log('❌ No token provided'); return res.status(401).json({ message: 'No token provided' }); }
    const decoded = verifyJWT(token);
    console.log('📝 Decoded token user ID:', decoded.userId);

    const adminUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { email: true, role: true, firstName: true, lastName: true }
    });
    console.log('📝 Admin user found:', adminUser);

    const isAdmin = adminUser && (
      adminUser.email === 'info@listsgenie.com' ||
      adminUser.email === 'admin@listsgenie.com' ||
      adminUser.role === 'admin'
    );
    console.log('📝 Is admin check result:', isAdmin);
    if (!isAdmin) { console.log('❌ Access denied - not admin'); return res.status(403).json({ message: 'Access denied. Admin only.' }); }

    const { ticketId } = req.params;
    const { response } = req.body;
    console.log('📝 Processing ticket ID:', ticketId);
    console.log('📝 Response text:', response);
    if (!response || !response.trim()) { console.log('❌ Empty response message'); return res.status(400).json({ message: 'Response message is required' }); }

    console.log('📝 Finding ticket in database...');
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: { user: { select: { firstName: true, lastName: true, email: true } } }
    });
    console.log('📝 Found ticket:', ticket ? 'Yes' : 'No');
    if (ticket) {
      console.log('📝 Ticket subject:', ticket.subject);
      console.log('📝 Ticket user email:', ticket.user?.email);
    }
    if (!ticket) { console.log('❌ Ticket not found'); return res.status(404).json({ message: 'Ticket not found' }); }
    if (!ticket.user) { console.log('❌ Ticket user not found'); return res.status(404).json({ message: 'Ticket user not found' }); }

    try {
      console.log('📧 Sending email to user...');
      const userName = `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || 'User';
      const emailResult = await sendSupportTicketEmail(ticket.user.email, userName, ticket.id, ticket.subject, response);
      console.log('📧 Email send result:', emailResult);

      console.log('💾 Updating ticket in database...');
      const updatedTicket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: 'resolved',
          adminResponse: response,
          responseAt: new Date(),
          respondedBy: decoded.userId,
          updatedAt: new Date()
        }
      });
      console.log('💾 Ticket updated successfully:', updatedTicket.id);
      console.log('💾 Admin response saved:', updatedTicket.adminResponse ? 'Yes' : 'No');

      console.log('✅ Admin response process completed successfully');
      res.json({ success: true, message: 'Response sent successfully' });
    } catch (emailError) {
      console.error('❌ Failed to send support response email:', emailError);
      try {
        console.log('💾 Updating ticket (email failed)...');
        const updatedTicket = await prisma.supportTicket.update({
          where: { id: ticketId },
          data: {
            status: 'resolved',
            adminResponse: response,
            responseAt: new Date(),
            respondedBy: decoded.userId,
            updatedAt: new Date()
          }
        });
        console.log('💾 Ticket updated (despite email failure):', updatedTicket.id);
        res.json({ success: true, message: 'Response saved but email failed to send' });
      } catch (dbError) {
        console.error('❌ Failed to update ticket:', dbError);
        res.status(500).json({ message: 'Failed to save response' });
      }
    }
  } catch (error) {
    console.error('❌ Send admin response error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to send response' });
  }
});

module.exports = router;
