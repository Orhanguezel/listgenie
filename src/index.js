// src/index.js
const http = require('http');
const app = require('./app');

const PORT = Number(process.env.PORT) || 5033;

const server = http.createServer(app);

// Keep-alive ve timeout ayarları (proxy’lerle uyumlu)
server.keepAliveTimeout = 61 * 1000;
server.headersTimeout   = 65 * 1000;
server.requestTimeout   = 120 * 1000;

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} kullanımda. .env içindeki PORT'u Postgres (5432) ile çakıştırmayın.`);
  } else {
    console.error('❌ HTTP server error:', err);
  }
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 ListsGenie Server running on port ${PORT}`);
  console.log(`📱 Local: http://localhost:${PORT}`);
});

// Graceful shutdown
function shutdown(sig) {
  console.log(`${sig} received, shutting down gracefully...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 10_000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
