const cron = require('node-cron');
const { prisma, checkDatabaseConnection } = require('../database/prisma');
const { sendLowCreditsEmail } = require('../mail');
const { safeLogging } = require('../utils/data-masking');

async function checkLowCredits() {
  try {
    console.log('🔍 Checking users with low credits...');
    const lowCreditUsers = await prisma.user.findMany({
      where: {
        credits: { lte: 5 },
        plan: { not: 'TRIAL' },
        planExpiresAt: { gt: new Date() }
      },
      select: { id: true, email: true, firstName: true, lastName: true, credits: true, plan: true, lastLowCreditEmailSent: true }
    });
    console.log(`📧 Found ${lowCreditUsers.length} users with low credits`);
    for (const user of lowCreditUsers) {
      const sevenDaysAgo = new Date(); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (!user.lastLowCreditEmailSent || user.lastLowCreditEmailSent < sevenDaysAgo) {
        const userName = (user.firstName && user.lastName) ? `${user.firstName} ${user.lastName}` : (user.firstName || user.email.split('@')[0]);
        safeLogging.logEmailSent('low_credits_warning', user.email, true);
        console.log(`💬 Sending low credits email to ${safeLogging.dataMasking.maskEmail(user.email)} (${user.credits} credits remaining)`);
        const emailResult = await sendLowCreditsEmail(user.email, userName, user.credits, user.plan);
        if (emailResult.success) {
          await prisma.user.update({ where: { id: user.id }, data: { lastLowCreditEmailSent: new Date() } });
          safeLogging.logEmailSent('low_credits_warning', user.email, true);
          console.log(`✅ Low credits email sent to ${safeLogging.dataMasking.maskEmail(user.email)}`);
        } else {
          safeLogging.logEmailSent('low_credits_warning', user.email, false);
          console.error(`❌ Failed to send email to ${safeLogging.dataMasking.maskEmail(user.email)}:`, emailResult.error);
        }
      } else {
        safeLogging.logEmailSent('low_credits_warning', user.email, false);
        console.log(`⏭️  Skipping ${safeLogging.dataMasking.maskEmail(user.email)} - email sent recently`);
      }
    }
    console.log('✅ Low credits check completed');
  } catch (error) {
    console.error('❌ Error checking low credits:', error);
  }
}

function scheduleLowCreditsCron() {
  const CRONS_DISABLED = process.env.DISABLE_CRONS === 'true' || process.env.SHARED_HOSTING === 'true';
  let isLowCreditsCheckRunning = false;

  cron.schedule('0 0 * * *', async () => {
    if (CRONS_DISABLED) { console.log('⏭️  Skipping low credits cron (DISABLE_CRONS/SHARED_HOSTING active)'); return; }
    try {
      const ok = await checkDatabaseConnection();
      if (!ok) { console.warn('⏭️  DB unavailable, skipping low credits cron'); return; }
    } catch (e) { console.warn('⏭️  DB check failed, skipping low credits cron:', e?.message || e); return; }
    if (isLowCreditsCheckRunning) { console.log('⏭️  Skipping low credits check: previous run still in progress'); return; }

    isLowCreditsCheckRunning = true;
    const runTimeout = setTimeout(() => console.warn('⏱️  Low credits check exceeded max runtime'), 10 * 60 * 1000);
    console.log('🕛 Midnight cron job: Starting low credits check...');
    Promise.resolve(checkLowCredits())
      .catch(err => console.error('❌ Low credits check error:', err))
      .finally(() => { clearTimeout(runTimeout); isLowCreditsCheckRunning = false; });
  }, { timezone: "Europe/Istanbul" });

  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => { console.log('🧪 Development mode: Running immediate low credits check...'); checkLowCredits(); }, 5000);
  }
}

module.exports = { scheduleLowCreditsCron, checkLowCredits };
