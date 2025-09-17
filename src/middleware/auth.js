const { verifyJWT } = require('../utils/jwt-security');
function authenticateToken(req,res,next){
  try{
    const token = (req.headers.authorization||'').split(' ')[1];
    if(!token) return res.status(401).json({message:'No token provided'});
    const dec = verifyJWT(token);
    req.user = { id: dec.userId || dec.id || dec.sub, ...dec };
    next();
  }catch(e){ return res.status(401).json({message:'Invalid token'}); }
}
function optionalAuth(req,res,next){
  try{
    const token = (req.headers.authorization||'').split(' ')[1];
    if(token){ req.user = verifyJWT(token); }
  }catch(e){ /* ignore */ }
  next();
}
function requireRole(role){
  return (req,res,next)=> {
    if(!req.user || (req.user.role||'').toLowerCase()!==role.toLowerCase())
      return res.status(403).json({message:'Access denied'});
    next();
  }
}
function requirePlan(plan){
  return (req,res,next)=> {
    if(!req.user || (req.user.plan||'').toLowerCase()!==plan.toLowerCase())
      return res.status(403).json({message:'Plan required'});
    next();
  }
}
module.exports={ authenticateToken, optionalAuth, requireRole, requirePlan };
