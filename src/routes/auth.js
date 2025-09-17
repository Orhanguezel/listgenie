const router = require('express').Router();
const { signJWT } = require('../utils/jwt-security');
const { prisma } = require('../database/prisma');

router.post('/login', async (req,res)=>{
  const { email = 'user@example.com' } = req.body||{};
  let user = await prisma.user.findUnique({ where:{ email } }).catch(()=>null);
  if(!user){
    user = await prisma.user.create({ data:{ email, plan:'FREE' } });
  }
  const token = signJWT({ userId: user.id, plan: user.plan, role: user.role||'user' });
  res.json({ token, user: { id:user.id, email:user.email } });
});

router.get('/me', async (req,res)=> res.json({ ok:true }));

module.exports = router;
