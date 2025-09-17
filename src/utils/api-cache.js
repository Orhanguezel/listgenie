const store = new Map(); // key -> {exp, value}
function cacheMiddleware(ttlSec=60){
  return (req,res,next)=>{
    if (req.method!=='GET') return next();
    const key = 'c:' + (req.originalUrl || req.url);
    const hit = store.get(key);
    const now = Date.now();
    if (hit && hit.exp>now){ return res.json(hit.value); }
    const send = res.json.bind(res);
    res.json = (body)=>{
      store.set(key,{exp: now + ttlSec*1000, value: body});
      return send(body);
    };
    next();
  }
}
function checkCacheHealth(){ return true; }
function startCacheMonitoring() { /* no-op stub */ }
const cacheManager={ flush(){ store.clear(); } };
module.exports={ cacheMiddleware, cacheManager, checkCacheHealth, startCacheMonitoring };
