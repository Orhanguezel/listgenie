const express = require('express');
const path = require('path');
const router = express.Router();
const ROOT = process.cwd();

// VERIFY-EMAIL ROUTE - Önde
router.get('/verify-email', (req, res) => {
  console.log('VERIFY-EMAIL HIT:', req.url, req.query);
  const filePath = path.join(ROOT, 'verify-email.html');
  console.log('Serving file:', filePath);
  res.sendFile(filePath);
});

// Main pages
router.get('/', (_req, res) => res.sendFile(path.join(ROOT, 'index.html')));
router.get('/login', (_req, res) => res.sendFile(path.join(ROOT, 'login.html')));
router.get('/register', (_req, res) => res.sendFile(path.join(ROOT, 'register.html')));
router.get('/dashboard', (_req, res) => res.sendFile(path.join(ROOT, 'dashboard.html')));
router.get('/success', (_req, res) => res.sendFile(path.join(ROOT, 'success.html')));
router.get('/reset-password', (_req, res) => res.sendFile(path.join(ROOT, 'reset-password.html')));

// Tools and resources
router.get('/fee-calculator', (_req, res) => res.sendFile(path.join(ROOT, 'fee-calculator.html')));
router.get('/seo-guide', (_req, res) => res.sendFile(path.join(ROOT, 'seo-guide.html')));
router.get('/blog', (_req, res) => res.sendFile(path.join(ROOT, 'blog.html')));
router.get('/contact', (_req, res) => res.sendFile(path.join(ROOT, 'contact.html')));
router.get('/pricing', (_req, res) => res.sendFile(path.join(ROOT, 'pricing.html')));

// Legal
router.get('/privacy-policy', (_req, res) => res.sendFile(path.join(ROOT, 'privacy-policy.html')));
router.get('/terms-of-service', (_req, res) => res.sendFile(path.join(ROOT, 'terms-of-service.html')));
router.get('/cookie-policy', (_req, res) => res.sendFile(path.join(ROOT, 'cookie-policy.html')));
router.get('/gdpr', (_req, res) => res.sendFile(path.join(ROOT, 'gdpr.html')));
router.get('/refund-policy', (_req, res) => res.sendFile(path.join(ROOT, 'refund-policy.html')));

// Docs & demo
router.get('/api-docs', (_req, res) => res.sendFile(path.join(ROOT, 'api-documantation.html')));
router.get('/demo-checkout', (_req, res) => res.sendFile(path.join(ROOT, 'demo-checkout.html')));

// Blog posts (root)
router.get('/etsy-seo-guide-2025', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'etsy-seo-guide-2025.html')));
router.get('/how-to-write-etsy-titles', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'how-to-write-etsy-titles.html')));
router.get('/etsy-analytics-growth', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'etsy-analytics-growth.html')));
router.get('/tags-blog', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'tags-blog.html')));
router.get('/social-media-blog', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'social-media-blog.html')));
router.get('/automated-blog', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'automated-blog.html')));

// Blog posts (/blog prefix)
router.get('/blog/keyword-blog', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'keyword-blog.html')));
router.get('/blog/etsy-seo-guide-2025', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'etsy-seo-guide-2025.html')));
router.get('/blog/how-to-write-etsy-titles', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'how-to-write-etsy-titles.html')));
router.get('/blog/etsy-analytics-growth', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'etsy-analytics-growth.html')));
router.get('/blog/tags-blog', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'tags-blog.html')));
router.get('/blog/social-media-blog', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'social-media-blog.html')));
router.get('/blog/automated-blog', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'automated-blog.html')));
router.get('/blog/product-photo', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'product-photo.html')));
router.get('/blog/deep', (_req, res) => res.sendFile(path.join(ROOT, 'blog', 'deep.html')));

// Redirects for old blog URLs
router.get('/blog/etsy-seo-guide-2024.html', (_req, res) => res.redirect('/blog/etsy-seo-guide-2025'));
router.get('/blog/etsy-tags-guide-2024', (_req, res) => res.redirect('/blog/tags-blog'));
router.get('/blog/product-photography-tips', (_req, res) => res.redirect('/blog/product-photo'));

// Meta.json
router.get('/meta.json', (_req, res) => {
  res.json({
    name: "ListsGenie",
    description: "AI-Powered Etsy SEO Tool for Sellers",
    version: "1.0.0",
    author: "ListsGenie Team",
    website: "https://listsgenie.com",
    type: "website",
    category: "ecommerce-tools",
    features: [
      "AI-powered listing optimization",
      "SEO keyword research",
      "Etsy tag generation",
      "Competition analysis",
      "Multi-language support"
    ],
    supported_platforms: ["web", "chrome-extension"],
    last_updated: "2025-01-01"
  });
});

// Guest checkout -> forward to payments router
router.post('/create-checkout-guest', (req, res, next) => {
  try {
    // Forward to /api/payments/create-checkout-guest to avoid duplicate code
    req.url = '/create-checkout-guest';
    const paymentsRouter = require('./payments'); // express.Router() exports a function (middleware)
    return paymentsRouter(req, res, next);
  } catch (e) {
    console.error('Forward to payments failed:', e);
    return res.status(500).json({ message: 'Failed to forward request' });
  }
});

module.exports = router;
