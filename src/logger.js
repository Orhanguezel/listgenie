const { createLogger, transports, format } = require('winston');
const base = { level:'info', format: format.combine(format.timestamp(), format.json()) };
const logger = createLogger({ ...base, transports:[ new transports.Console() ] });
const securityLogger = logger;
const performanceLogger = logger;
const auditLogger = logger;

function requestLogger(req,res,next){
  const start = Date.now();
  res.on('finish',()=> logger.info('request',{method:req.method,url:req.originalUrl,status:res.statusCode,ms:Date.now()-start}));
  next();
}
const logHelpers = {};
module.exports={ logger, securityLogger, performanceLogger, auditLogger, logHelpers, requestLogger };
