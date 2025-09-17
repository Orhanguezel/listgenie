const errors=[];
const errorTracker={
  middleware(){ return (err,req,res,next)=>{ errors.push({ts:Date.now(), message:err.message, stack:err.stack}); next(err); }; },
  logError(e,ctx){ errors.push({ts:Date.now(), message:e.message, stack:e.stack, ctx}); },
  getErrorStats(hours=24){ const since=Date.now()-hours*3600*1000; const arr=errors.filter(e=>e.ts>=since); return { count: arr.length }; },
  captureException(e,ctx){ this.logError(e,ctx); }
};
const browserErrorTracker = `
window.addEventListener('error', function(e){
  fetch('/api/errors/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'window.onerror',message:e.message,stack:e.error&&e.error.stack,url:location.href})});
});`;
module.exports={ errorTracker, browserErrorTracker };
