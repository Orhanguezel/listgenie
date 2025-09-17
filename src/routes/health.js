const express = require('express');
const router = express.Router();
const monitoring = require('../monitoring-system');
const { prisma } = require('../database/prisma');
const { extensionLimiter } = require('../security-improvements');

router.get('/health', async (_req, res) => {
  const healthStatus = {
    status: 'running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: { server:'healthy', database:'unknown', cache:'unknown', monitoring:'unknown' }
  };
  try {
    const detailedHealth = await monitoring.performHealthCheck();
    healthStatus.services = detailedHealth.checks || healthStatus.services;
    healthStatus.status = detailedHealth.status || 'running';
  } catch (err) {
    console.warn('⚠️  Health check monitoring failed:', err.message);
    healthStatus.services.monitoring = 'degraded';
    healthStatus.message = 'Server running with limited monitoring';
  }
  res.status(200).json(healthStatus);
});

router.get('/health/simple', (_req, res) => {
  res.status(200).json({ status:'server_running', timestamp:new Date().toISOString(), uptime: Math.floor(process.uptime()), message:'Server is operational' });
});
router.get('/health/quick', (_req, res) => {
  res.json({ status:'OK', timestamp:new Date().toISOString(), uptime: Math.floor(process.uptime()), version:'1.0.0' });
});
router.get('/health/database', async (_req, res) => {
  try {
    const dbHealth = await monitoring.checks.database();
    const statusCode = dbHealth.healthy ? 200 : 503;
    res.status(statusCode).json({ status: dbHealth.healthy ? 'healthy':'unhealthy', message: dbHealth.message, details: dbHealth.details, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status:'error', message:'Database health check failed', error: error.message, timestamp:new Date().toISOString() });
  }
});

router.get('/health/database-test', async (_req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    res.status(200).json({ status:'database_connected', test_result: result, timestamp:new Date().toISOString(), message:'Database connection successful' });
  } catch (error) {
    res.status(503).json({ status:'database_error', error:error.message, timestamp:new Date().toISOString(), message:'Database connection failed' });
  }
});
router.get('/health/env-test', (_req, res) => {
  const requiredEnvs = ['DATABASE_URL','JWT_SECRET','ENCRYPTION_KEY','OPENAI_API_KEY','SMTP_HOST','SMTP_USER','SMTP_PASS'];
  const envStatus = {}; requiredEnvs.forEach(k => { envStatus[k] = process.env[k] ? 'set' : 'missing'; });
  res.status(200).json({ status:'env_check', environment_variables: envStatus, timestamp:new Date().toISOString() });
});

router.get('/extension/health', extensionLimiter, (req, res) => {
  res.json({ status: 'OK', service: 'Extension API', timestamp: new Date().toISOString(), version: '1.0.0' });
});

router.get('/health/metrics', (_req, res) => {
  try {
    const metrics = typeof monitoring.getSystemMetrics === 'function'
      ? monitoring.getSystemMetrics()
      : {
          process: {
            pid: process.pid,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            versions: process.versions
          }
        };

    res.status(200).json({
      status: 'OK',
      metrics,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Metrics collection failed',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
