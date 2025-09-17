// src/app.js
require('./config/env'); // ENV doğrulama + JWT güvenlik logu

const express = require('express');
const app = express();

const compression = require('compression');
const cors = require('cors');

const security = require('./security-improvements');
const { corsOptions, apiLimiter, paymentLimiter } = require('./security-improvements');
const { applyTrustProxy, httpsRedirect, staticServing } = require('./config/express');

const cloudflareHeaders = require('./middleware/cloudflare');
const blockBadAssets = require('./middleware/malicious');
const selectiveRequestLogger = require('./middleware/logging');
const { createUploadDirectories, parsers } = require('./middleware/limits');
const { mountCsrfEndpoints } = require('./middleware/csrf');

// ---- Proxy & HTTPS ----
applyTrustProxy(app);
httpsRedirect(app);

// ---- Headers & Logs ----
app.use(cloudflareHeaders());
app.use(selectiveRequestLogger());

// ---- Security ----
app.use(security.helmetConfig);
console.log('✅ Helmet security middleware enabled for production');

app.use(compression());
app.use(cors(corsOptions));

// ---- Block bad assets ----
app.use(blockBadAssets());

// ---- Rate limiting ----
app.use('/api/', apiLimiter);
app.use('/api/payments/create-checkout', paymentLimiter);
app.use('/api/payments/create-checkout-guest', paymentLimiter);
console.log('✅ API rate limiting enabled for production');

// ---- Body parsers & uploads ----
createUploadDirectories();
parsers().forEach(mw => app.use(mw));

// ---- CSRF endpoint'leri ----
mountCsrfEndpoints(app);
console.log('✅ Modern CSRF protection enabled');

// ========== HTML ROUTES ==========
app.use('/', require('./routes/html')); // sendFile route’ları

// ========== API ROUTES ==========
app.use('/api', require('./routes/etsy'));
app.use('/api', require('./routes/health'));        // /api/health*, /api/extension/health
app.use('/api', require('./routes/contact'));
app.use('/api', require('./routes/mail'));          // stub dolduruldu
app.use('/api', require('./routes/notifications')); // stub
app.use('/api', require('./routes/support'));       // stub
app.use('/api/admin', require('./routes/admin'));   // stub (admin)
app.use('/api', require('./routes/errors'));        // stub
app.use('/api/user', require('./routes/user'));     // stub
app.use('/', require('./routes/verify'));           // /verify, /user/profile (legacy)

// Mevcut modüller
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payments', require('./routes/payments'));

// ---- Static ----
staticServing(app);

// ---- 404 ----
app.use((req, res) => res.status(404).json({ message: 'Endpoint not found', path: req.path }));

module.exports = app;
