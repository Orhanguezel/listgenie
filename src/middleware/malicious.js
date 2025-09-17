module.exports = function blockBadAssets() {
  return (req, res, next) => {
    if (req.url.includes('back_to_spaceship') ||
        req.url.includes('unprotected/') ||
        req.url.includes('spaceship') ||
        req.url.match(/\.(js|css).*hash=/)) {
      console.warn('⛔ Blocked malicious script request:', req.url, 'from IP:', req.ip);
      return res.status(404).json({ error: 'Not Found' });
    }
    next();
  };
};
