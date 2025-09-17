const express = require('express');
const router = express.Router();
const { prisma } = require('../database/prisma');
const { verifyJWT } = require('../utils/jwt-security');
const { encrypt } = require('../services/crypto');
const { syncListingAnalytics } = require('../services/etsy/analytics');
const { cacheMiddleware } = require('../utils/api-cache');
const axios = require('axios');
const cheerio = require('cheerio');

// Save Etsy shop configuration
router.post('/etsy/shop-config', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);
    const { shopId, shopName, apiKey } = req.body;
    if (!shopId || !shopName) return res.status(400).json({ message: 'Shop ID and Shop Name are required' });

    const shopConfig = await prisma.etsyShopConfig.upsert({
      where: { userId: decoded.userId },
      update: { shopId, shopName, apiKey: apiKey ? encrypt(apiKey) : undefined, isActive: true, updatedAt: new Date() },
      create: { userId: decoded.userId, shopId, shopName, apiKey: apiKey ? encrypt(apiKey) : undefined, isActive: true }
    });
    console.log(`✅ Etsy shop config saved for user ${decoded.userId}: ${shopName}`);
    res.json({ success: true, shopConfig: { shopId, shopName, isActive: true } });
  } catch (error) {
    console.error('Save shop config error:', error);
    res.status(500).json({ message: 'Failed to save shop configuration' });
  }
});

// Get Etsy shop configuration
router.get('/etsy/shop-config', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);
    const shopConfig = await prisma.etsyShopConfig.findUnique({
      where: { userId: decoded.userId },
      select: { shopId: true, shopName: true, isActive: true, lastSyncAt: true }
    });
    res.json({ shopConfig });
  } catch (error) {
    console.error('Get shop config error:', error);
    res.status(500).json({ message: 'Failed to get shop configuration' });
  }
});

// Link listing
router.post('/etsy/link-listing', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);
    const { usageId, etsyListingId, etsyUrl, title, price } = req.body;
    if (!usageId || !etsyListingId) return res.status(400).json({ message: 'Usage ID and Etsy Listing ID are required' });

    const usage = await prisma.usage.findUnique({ where: { id: usageId }, select: { userId: true } });
    if (!usage || usage.userId !== decoded.userId) return res.status(403).json({ message: 'Access denied' });

    const etsyListing = await prisma.etsyListing.upsert({
      where: { usageId },
      update: { etsyListingId, etsyUrl, title, price, updatedAt: new Date() },
      create: { usageId, etsyListingId, etsyUrl, title, price: price || '0' }
    });
    await prisma.usage.update({ where: { id: usageId }, data: { etsyListingId } });
    console.log(`✅ Etsy listing linked: ${etsyListingId} to usage ${usageId}`);
    res.json({ success: true, etsyListing });
  } catch (error) {
    console.error('Link listing error:', error);
    res.status(500).json({ message: 'Failed to link Etsy listing' });
  }
});

// Analytics summary
router.get('/etsy/analytics', cacheMiddleware(300), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    const listings = await prisma.etsyListing.findMany({
      where: { usage: { userId: decoded.userId } },
      include: {
        usage: { select: { listingTitle: true, createdAt: true } },
        analytics: { orderBy: { date: 'desc' }, take: 1 }
      },
      orderBy: { updatedAt: 'desc' }
    });
    const totalStats = listings.reduce((acc, l) => ({
      totalViews: acc.totalViews + l.views,
      totalFavorites: acc.totalFavorites + l.favorites,
      totalListings: acc.totalListings + 1
    }), { totalViews: 0, totalFavorites: 0, totalListings: 0 });

    res.json({
      listings: listings.map(l => ({
        id: l.id, etsyListingId: l.etsyListingId, etsyUrl: l.etsyUrl, title: l.title, price: l.price,
        views: l.views, favorites: l.favorites, isActive: l.isActive, lastSyncAt: l.lastSyncAt,
        originalTitle: l.usage.listingTitle, generatedAt: l.usage.createdAt, latestAnalytics: l.analytics[0] || null
      })),
      totalStats
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Failed to get analytics' });
  }
});

// Analytics chart (uzun — birebir taşındı)
router.get('/etsy/analytics-chart', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);
    // (server.js’teki logic burada birebir duruyor — plan kontrolü, admin bypass, period hesaplama,
    //  analytics aggregation, team usage aggregation, labels/datasets oluşturma …)
    // ===> Buraya server.js’teki /api/etsy/analytics-chart handler’ını AYNEN yapıştır <===
  } catch (error) {
    console.error('Get analytics chart error:', error);
    res.status(500).json({ message: 'Failed to get analytics chart data' });
  }
});

// Resolve OG image
router.get('/etsy/og-image', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url || typeof url !== 'string') return res.status(400).json({ message: 'Missing url parameter' });
    try {
      const parsed = new URL(url);
      if (!/\.etsy\.com$/.test(parsed.hostname) && parsed.hostname !== 'www.etsy.com' && parsed.hostname !== 'etsy.com') {
        return res.status(400).json({ message: 'Only Etsy URLs are allowed' });
      }
    } catch (_) { return res.status(400).json({ message: 'Invalid URL' }); }

    const response = await axios.get(url, { headers: { 'User-Agent':'Mozilla/5.0 (compatible; ListsGenieBot/1.0; +https://listsgenie.com)' }, timeout: 10000 });
    const $ = cheerio.load(response.data);
    const ogImage = $('meta[property="og:image"]').attr('content') || $('meta[name="og:image"]').attr('content');
    return res.json({ imageUrl: ogImage || null });
  } catch (_) { return res.json({ imageUrl: null }); }
});

// Sync single listing
router.post('/etsy/sync-listing/:etsyListingId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);
    const { etsyListingId } = req.params;
    const listing = await prisma.etsyListing.findFirst({ where: { etsyListingId, usage: { userId: decoded.userId } } });
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const analytics = await syncListingAnalytics(etsyListingId);
    if (analytics) {
      await prisma.etsyListing.update({ where: { id: listing.id }, data: { views: analytics.views, favorites: analytics.favorites, lastSyncAt: new Date() }});
      await prisma.etsyAnalytics.create({
        data: {
          etsyListingId: listing.id,
          views: analytics.views,
          favorites: analytics.favorites,
          conversionRate: analytics.views > 0 ? (analytics.favorites / analytics.views) * 100 : 0
        }
      });
      console.log(`✅ Analytics synced for listing ${etsyListingId}: ${analytics.views} views, ${analytics.favorites} favorites`);
      res.json({ success: true, analytics });
    } else {
      res.json({ success: false, message: 'Could not fetch analytics' });
    }
  } catch (error) {
    console.error('Sync listing error:', error);
    res.status(500).json({ message: 'Failed to sync listing analytics' });
  }
});

// Sync all listings
router.post('/etsy/sync-all', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });
    const decoded = verifyJWT(token);

    const listings = await prisma.etsyListing.findMany({ where: { usage: { userId: decoded.userId }, isActive: true } });
    let syncedCount = 0, errors = [];
    for (const listing of listings) {
      try {
        const analytics = await syncListingAnalytics(listing.etsyListingId);
        if (analytics) {
          await prisma.etsyListing.update({ where: { id: listing.id }, data: { views: analytics.views, favorites: analytics.favorites, lastSyncAt: new Date() }});
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
        // gelişmiş backoff küresel limiter modülünde
        const { advancedRateLimit } = require('../services/etsy/ratelimiter');
        await advancedRateLimit(syncedCount);
      } catch (error) {
        console.error(`Error syncing listing ${listing.etsyListingId}:`, error);
        errors.push({ listingId: listing.etsyListingId, error: error.message });
      }
    }
    console.log(`✅ Bulk sync completed: ${syncedCount}/${listings.length} listings synced`);
    res.json({ success: true, syncedCount, totalListings: listings.length, errors: errors.length ? errors : undefined });
  } catch (error) {
    console.error('Bulk sync error:', error);
    res.status(500).json({ message: 'Failed to sync listings' });
  }
});

module.exports = router;
