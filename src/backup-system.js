const fs = require('fs'); const path=require('path');
const dir = path.join(process.cwd(),'backups');
if(!fs.existsSync(dir)) fs.mkdirSync(dir,{recursive:true});
async function createManualBackup(tag='manual'){
  const file = path.join(dir, `backup-${tag}-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify({ts:new Date().toISOString()}));
  return file;
}
function getBackupList(){
  return fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>({filename:f}));
}
async function restoreFromBackup(name){ /* stub */ return true; }
module.exports = { createManualBackup, getBackupList, restoreFromBackup };
