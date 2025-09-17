const cron = require('node-cron');
const { prisma, checkDatabaseConnection } = require('../database/prisma'); // proje kökünde aynı path ile eriş
const { syncListingAnalytics } = require('../services/etsy/analytics');

let isDailySyncRunning = false;
const CRONS_DISABLED = process.env.DISABLE_CRONS === 'true' || process.env.SHARED_HOSTING === 'true';

function scheduleDailyEtsySync() {
  cron.schedule('0 3 * * *', async () => {
    if (CRONS_DISABLED) { console.log('⏭️  Skipping daily analytics cron (DISABLE_CRONS/SHARED_HOSTING active)'); return; }
    try {
      const ok = await checkDatabaseConnection();
      if (!ok) { console.warn('⏭️  DB unavailable, skipping daily analytics cron'); return; }
    } catch (e) { console.warn('⏭️  DB check failed, skipping daily analytics cron:', e?.message || e); return; }
    if (isDailySyncRunning) { console.log('⏭️  Skipping daily Etsy analytics sync: previous run still in progress'); return; }

    isDailySyncRunning = true;
    const hardTimeout = setTimeout(() => {
      console.warn('⏱️  Daily sync exceeded max runtime, aborting');
    }, 20 * 60 * 1000);

    console.log('🛠️ Starting daily Etsy analytics sync...');
    try {
      const activeListings = await prisma.etsyListing.findMany({
        where: { isActive: true, lastSyncAt: { lt: new Date(Date.now() - 24*60*60*1000) } },
        take: 10
      });
      let syncedCount = 0;
      for (const listing of activeListings) {
        try {
          const analytics = await syncListingAnalytics(listing.etsyListingId);
          if (analytics) {
            await prisma.etsyListing.update({
              where: { id: listing.id },
              data: {
                views: analytics.views,
                favorites: analytics.favorites,
                lastSyncAt: new Date()
              }
            });
            await prisma.etsyAnalytics.create({
              data: {
                etsyListingId: listing.id,
                views: analytics.views,
                favorites: analytics.favorites,
                conversionRate: analytics.views > 0 ? (analytics.favorites / analytics.views) * 100 : 0
              }
            });
            syncedCount++;
          }
          await new Promise(r => setTimeout(r, 5000));
        } catch (err) {
          console.error(`Error in daily sync for listing ${listing.etsyListingId}:`, err);
        }
      }
      console.log(`✅ Daily sync completed: ${syncedCount}/${activeListings.length} listings updated`);
    } catch (error) {
      console.error('❌ Daily sync error:', error);
    } finally {
      clearTimeout(hardTimeout);
      isDailySyncRunning = false;
    }
  }, { timezone: "UTC" });
}
module.exports = { scheduleDailyEtsySync };
