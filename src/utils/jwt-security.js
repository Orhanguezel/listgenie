const jwt = require('jsonwebtoken');

function getJWTSecret() {
  return process.env.JWT_SECRET || 'dev-secret-change-me';
}
function signJWT(payload, opts = {}) {
  return jwt.sign(payload, getJWTSecret(), { expiresIn: opts.expiresIn || '7d' });
}
function verifyJWT(token) {
  return jwt.verify(token, getJWTSecret());
}
function getSecurityStatus() {
  return { algorithm: 'HS256', secretPresent: !!process.env.JWT_SECRET };
}
const jwtSecurityManager = {
  rotate() { /* no-op stub */ },
  status: getSecurityStatus()
};
module.exports = { jwtSecurityManager, getJWTSecret, verifyJWT, signJWT, getSecurityStatus };
