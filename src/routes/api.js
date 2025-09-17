const router = require('express').Router();
router.get('/status', (req,res)=> res.json({ ok:true, ts:new Date().toISOString() }));
module.exports = router;
