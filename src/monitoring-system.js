const os = require('os'); const { checkDatabaseConnection } = require('./database/prisma');
async function performHealthCheck(){
  const db = await checkDatabaseConnection();
  return { status: db ? 'healthy':'degraded', checks:{ server:'healthy', database: db?'healthy':'unhealthy', cache:'unknown', monitoring:'healthy' } };
}
const checks={
  async database(){ const ok = await checkDatabaseConnection(); return { healthy: ok, message: ok?'DB OK':'DB FAIL', details:{} }; }
};
function getSystemMetrics(){
  return { loadavg: os.loadavg(), freemem: os.freemem(), totalmem: os.totalmem(), uptime: os.uptime() };
}
function getUptimeRobotConfig(){ return { monitors: [] }; }
module.exports = { performHealthCheck, checks, getSystemMetrics, getUptimeRobotConfig };
