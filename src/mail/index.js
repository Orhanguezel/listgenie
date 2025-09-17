async function ok(){ return { success:true, messageId: String(Date.now()) }; }
async function testConnection(){ return true; }
async function sendTestEmail(){ return ok(); }
module.exports = {
  testConnection, sendTestEmail,
  sendVerificationEmail: ok, sendWelcomeEmail: ok, sendPasswordResetEmail: ok,
  sendLowCreditsEmail: ok, sendTeamInvitationEmail: ok, sendContactFormEmail: ok,
  sendSupportTicketEmail: ok, sendSubscriptionConfirmationEmail: ok
};
