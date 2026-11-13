const express = require('express');
const { authOptional } = require('../middleware/auth');

const router = express.Router();

router.use(authOptional);
router.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// On Vercel nothing runs in the background, so flash sales are started / ended here,
// checked at most every 30 seconds while visitors are using the shop.
if (process.env.VERCEL) {
  const flash = require('../services/flash');
  let lastCheck = 0;
  router.use((req, res, next) => {
    if (Date.now() - lastCheck < 30000) return next();
    lastCheck = Date.now();
    flash.tick().catch((e) => console.warn('[flash sales]', e.message)).finally(() => next());
  });
}
router.use('/auth', require('./auth'));
router.use('/payment', require('./payment'));
router.use('/admin', require('./admin'));
router.use('/', require('./public'));

module.exports = router;
