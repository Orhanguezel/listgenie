let timer=null;
function startMonitoring(){
  if (timer) return;
  timer=setInterval(()=>{
    const m=process.memoryUsage();
    // hafif rapor
  }, 60000);
}
function stopMonitoring(){ if (timer){clearInterval(timer); timer=null;} }
module.exports={memoryMonitor:{startMonitoring,stopMonitoring}};
