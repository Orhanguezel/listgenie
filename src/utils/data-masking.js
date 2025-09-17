function maskEmail(e){ return e.replace(/(.).+(@.+)/,'$1***$2'); }
const safeLogging={
  dataMasking:{ maskEmail },
  logUserAction:(type,data)=>console.log('[AUDIT]',type,data||{}),
  logEmailSent:(type,to,ok)=>console.log('[MAIL]',type, maskEmail(to), ok?'OK':'FAIL')
};
module.exports={ safeLogging };
