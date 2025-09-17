module.exports = function cloudflareHeaders() {
  return (req, _res, next) => {
    req.realIP = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
    req.country = req.headers['cf-ipcountry'];
    req.userAgent = req.headers['cf-user-agent'];
    if (process.env.NODE_ENV === 'production') {
      if (Math.floor(Math.random() * 50) === 0) {
        console.log(`🌍 Cloudflare Info - IP: ${req.realIP}, Country: ${req.country || 'n/a'}`);
      }
    }
    next();
  };
};
