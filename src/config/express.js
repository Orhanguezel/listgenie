// src/config/express.js
const express = require('express');
const path = require('path');

function applyTrustProxy(app) {
  // Behind Cloudflare/NGINX, trust first proxy hop
  app.set('trust proxy', 1);
}

function httpsRedirect(app) {
  // Force HTTPS in production (skip localhost)
  app.use((req, res, next) => {
    const isLocalhost = req.headers.host && req.headers.host.includes('localhost');
    if (
      process.env.NODE_ENV === 'production' &&
      !req.secure &&
      req.get('X-Forwarded-Proto') !== 'https' &&
      !isLocalhost
    ) {
      return res.redirect(301, 'https://' + req.headers.host + req.url);
    }
    next();
  });
}

function cloudflareHeaders(app) {
  app.use((req, _res, next) => {
    req.realIP = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
    req.country = req.headers['cf-ipcountry'];
    req.userAgent = req.headers['cf-user-agent'];
    if (process.env.NODE_ENV === 'production') {
      if (Math.floor(Math.random() * 50) === 0) {
        console.log(`🌍 Cloudflare Info - IP: ${req.realIP}, Country: ${req.country || 'n/a'}`);
      }
    }
    next();
  });
}

function staticServing(app) {
  // /uploads klasörünü servis et
  app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

  // Proje kökünden statik dosyalar
  app.use(
    express.static(path.resolve(process.cwd()), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (filePath.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
      },
      maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
      etag: true,
    })
  );
}

module.exports = {
  applyTrustProxy,
  httpsRedirect,
  cloudflareHeaders,
  staticServing,
};
