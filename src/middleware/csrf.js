const crypto = require('crypto');
function generateCSRFToken() { return crypto.randomBytes(32).toString('hex'); }

function csrfValidation(req, res, next) {
  if (['GET','HEAD','OPTIONS'].includes(req.method)) return next();
  if (req.path.startsWith('/api/') && (req.headers['x-api-key'] || req.headers['authorization'])) return next();
  const token = req.headers['x-csrf-token'] || req.body._csrf || req.query._csrf;
  const sessionToken = req.session?.csrfToken;
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ error:'Invalid CSRF token', message:'CSRF protection validation failed' });
  }
  next();
}
function mountCsrfEndpoints(app) {
  app.get('/csrf-token', (req, res) => {
    if (!req.session) return res.status(500).json({ error: 'Session not available' });
    const token = generateCSRFToken();
    req.session.csrfToken = token;
    res.json({ csrfToken: token });
  });
  console.log('✅ Modern CSRF protection enabled');
}
module.exports = { csrfValidation, mountCsrfEndpoints };
