const router = require('express').Router();
router.post('/create-checkout', (req,res)=> res.json({ success:true, checkoutId:'stub' }));
router.post('/create-checkout-guest', (req,res)=> res.json({ success:true, checkoutId:'guest-stub' }));
router.post('/stripe-webhook', (req,res)=> res.status(200).end());
module.exports = router;
