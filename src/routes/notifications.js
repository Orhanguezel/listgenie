const express = require('express');
const router = express.Router();
const { prisma } = require('../database/prisma');
const { verifyJWT } = require('../utils/jwt-security');
const { cacheMiddleware } = require('../utils/api-cache');
const { safeLogging } = require('../utils/data-masking');

// Get user notifications
router.get('/notifications', cacheMiddleware(180), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    const notifications = await prisma.userNotification.findMany({
      where: { userId: decoded.userId },
      include: { notification: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const unreadCount = await prisma.userNotification.count({
      where: { userId: decoded.userId, isRead: false }
    });

    res.json({
      notifications: notifications.map(un => ({
        id: un.id,
        notificationId: un.notificationId,
        isRead: un.isRead,
        readAt: un.readAt,
        createdAt: un.createdAt,
        title: un.notification.title,
        content: un.notification.content,
        type: un.notification.type,
        priority: un.notification.priority,
        icon: un.notification.icon,
        actionUrl: un.notification.actionUrl
      })),
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Failed to get notifications' });
  }
});

// Mark notification as read
router.post('/notifications/:id/read', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);
    const { id } = req.params;

    await prisma.userNotification.updateMany({
      where: { id, userId: decoded.userId },
      data: { isRead: true, readAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
});

// Mark all as read
router.post('/notifications/read-all', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    await prisma.userNotification.updateMany({
      where: { userId: decoded.userId, isRead: false },
      data: { isRead: true, readAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
});

// Admin: Broadcast notification
router.post('/admin/notifications/broadcast', async (req, res) => {
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

    const { title, content, type = 'announcement', priority = 'normal', icon, actionUrl } = req.body;
    if (!title || !content) return res.status(400).json({ message: 'Title and content are required' });

    const notification = await prisma.notification.create({
      data: { title, content, type, priority, icon, actionUrl, sentBy: adminUser.email }
    });

    const users = await prisma.user.findMany({
      where: { planExpiresAt: { gt: new Date() } },
      select: { id: true }
    });
    const trialUsers = await prisma.user.findMany({
      where: { plan: 'TRIAL' },
      select: { id: true }
    });
    const allUsers = [...users, ...trialUsers];

    await prisma.userNotification.createMany({
      data: allUsers.map(u => ({ userId: u.id, notificationId: notification.id })),
      skipDuplicates: true
    });

    safeLogging.logUserAction?.('admin_notification_sent', {
      adminEmail: adminUser.email,
      recipientCount: allUsers.length
    });
    console.log(`📰 Notification: "${title}"`);

    res.json({
      success: true,
      message: `Notification sent to ${allUsers.length} users`,
      notificationId: notification.id,
      userCount: allUsers.length
    });
  } catch (error) {
    console.error('Broadcast notification error:', error);
    res.status(500).json({ message: 'Failed to send notification' });
  }
});

// Admin: List notifications
router.get('/admin/notifications', async (req, res) => {
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

    const notifications = await prisma.notification.findMany({
      include: { _count: { select: { userNotifications: true } } },
      orderBy: { sentAt: 'desc' },
      take: 50
    });

    res.json(notifications.map(n => ({ ...n, recipientCount: n._count.userNotifications })));
  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({ message: 'Failed to get notifications' });
  }
});

module.exports = router;
