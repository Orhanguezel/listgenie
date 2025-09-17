const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');

const helmetConfig = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
});

const corsOptions = {
  origin: (o, cb) => cb(null, true),
  credentials: true
};

const apiLimiter = rateLimit({ windowMs: 15*60*1000, max: 300 });
const extensionLimiter = rateLimit({ windowMs: 60*1000, max: 60 });
const paymentLimiter = rateLimit({ windowMs: 60*1000, max: 20 });

function requestLogger(req, res, next){
  const start = Date.now();
  res.on('finish', ()=> {
    const ms = Date.now() - start;
    console.log(`[REQ] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${ms}ms)`);
  });
  next();
}

module.exports = { helmetConfig, apiLimiter, extensionLimiter, paymentLimiter, requestLogger, corsOptions };
