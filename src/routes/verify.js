const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { prisma } = require('../database/prisma');

// /verify token endpoint (compat)
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, userId: req.user.id });
});

// /user/profile (compat) - direct implementation
router.get('/user/profile', authenticateToken, async (req, res) => {
  console.log('⚠️ Legacy /user/profile call detected, handling directly');
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        plan: true, credits: true, planExpiresAt: true, apiKey: true, teamId: true
      }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let teamInvite = false;
    let teamOwnerApiKey = null;
    if (user.teamId) {
      const invitation = await prisma.teamInvitation.findFirst({
        where: { email: user.email, teamId: user.teamId, status: 'accepted' },
        orderBy: { createdAt: 'desc' },
        include: { inviter: true }
      });
      if (invitation) {
        teamInvite = true;
        teamOwnerApiKey = invitation.inviter.apiKey;
      }
    }

    res.json({ ...user, teamInvite, teamOwnerApiKey });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

module.exports = router;
