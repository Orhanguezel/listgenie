const { requestLogger: winstonRequestLogger } = require('../logger');
module.exports = function selectiveRequestLogger() {
  return (req, res, next) => {
    if (req.method === 'GET' && (req.url.endsWith('.css') || req.url.endsWith('.js') || req.url.startsWith('/assets/') || req.url.startsWith('/uploads/'))) {
      return next();
    }
    return winstonRequestLogger(req, res, next);
  };
};
