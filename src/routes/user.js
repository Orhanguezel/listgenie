const express = require('express');
const router = express.Router();
const { prisma } = require('../database/prisma');
const { verifyJWT } = require('../utils/jwt-security');
const { sendTeamInvitationEmail } = require('../mail');

// Get user template preferences
router.get('/template', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { templateStyle: true, templatePreferences: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      templateStyle: user.templateStyle || 'professional',
      templatePreferences: user.templatePreferences ? JSON.parse(user.templatePreferences) : {}
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ message: 'Failed to get template preferences' });
  }
});

// Update user template preferences
router.post('/template', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    const { templateStyle, templatePreferences } = req.body;
    await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        templateStyle: templateStyle || 'professional',
        templatePreferences: templatePreferences ? JSON.stringify(templatePreferences) : null
      }
    });

    console.log(`✅ Template preferences updated for user ${decoded.userId}: ${templateStyle}`);
    res.json({
      success: true,
      message: 'Template preferences updated successfully',
      templateStyle,
      templatePreferences
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Failed to update template preferences' });
  }
});

// Team invite
router.post('/team/invite', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const inviter = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, firstName: true, lastName: true, plan: true, teamId: true, apiKey: true }
    });
    if (!inviter) return res.status(404).json({ message: 'User not found' });

    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    let teamId = inviter.teamId;
    if (!teamId) {
      const team = await prisma.team.create({ data: { name: 'My Team', ownerId: inviter.id, maxMembers: 3 } });
      teamId = team.id;
      await prisma.user.update({ where: { id: inviter.id }, data: { teamId } });
    }

    const teamMembers = await prisma.user.count({ where: { teamId } });
    if (teamMembers >= 3) return res.status(400).json({ message: 'Team is at maximum capacity (3 members)' });

    const invitationToken = require('crypto').randomBytes(32).toString('hex');
    const invitationExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await prisma.teamInvitation.create({
      data: {
        email: email.toLowerCase(),
        inviterId: inviter.id,
        teamId,
        token: invitationToken,
        expiresAt: invitationExpiry,
        status: 'pending'
      }
    });

    const invitationLink = `${process.env.APP_URL || 'https://www.listsgenie.com'}/register?invite=${invitationToken}`;
    try {
      await sendTeamInvitationEmail(email, `${inviter.firstName} ${inviter.lastName}`, inviter.email, invitationLink);
      console.log(`✅ Team invitation email sent to ${email}`);
    } catch (emailError) {
      console.error('❌ Failed to send team invitation email:', emailError.message);
      return res.status(500).json({ message: 'Failed to send invitation email' });
    }

    console.log(`✅ Team invite created for ${email} by user ${inviter.id}`);
    res.json({ success: true, message: 'Team invitation sent successfully', email });
  } catch (error) {
    console.error('Team invite error:', error);
    res.status(500).json({ message: 'Failed to send team invitation' });
  }
});

// Get invitation details
router.get('/team/invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
      include: {
        inviter: { select: { firstName: true, lastName: true, email: true } },
        team: { select: { name: true } }
      }
    });

    if (!invitation) return res.status(404).json({ message: 'Invitation not found' });
    if (invitation.status !== 'pending') return res.status(400).json({ message: 'Invitation has already been used or expired' });
    if (invitation.expiresAt < new Date()) return res.status(400).json({ message: 'Invitation has expired' });

    res.json({
      email: invitation.email,
      inviterName: `${invitation.inviter.firstName} ${invitation.inviter.lastName}`,
      inviterEmail: invitation.inviter.email,
      teamName: invitation.team.name
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    res.status(500).json({ message: 'Failed to get invitation details' });
  }
});

module.exports = router;
