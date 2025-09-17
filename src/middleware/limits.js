const path = require('path');
const fs = require('fs');
const express = require('express');

function createUploadDirectories() {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const profilesDir = path.join(uploadsDir, 'profiles');
  if (!fs.existsSync(uploadsDir)) { fs.mkdirSync(uploadsDir, { recursive: true }); console.log('🗄️ Created uploads directory'); }
  if (!fs.existsSync(profilesDir)) { fs.mkdirSync(profilesDir, { recursive: true }); console.log('🗄️ Created uploads/profiles directory'); }
}

function parsers() {
  return [
    (req, res, next) => {
      if (req.path.startsWith('/api/payments/stripe-webhook')) return next();
      if (req.path.startsWith('/api/extension/generate-listing')) return express.json({ limit: '10mb' })(req, res, next);
      return express.json({ limit: '1mb' })(req, res, next);
    },
    (req, res, next) => {
      if (req.path.startsWith('/api/payments/stripe-webhook')) return next();
      return express.urlencoded({ limit: '1mb', extended: true })(req, res, next);
    }
  ];
}
module.exports = { createUploadDirectories, parsers };
