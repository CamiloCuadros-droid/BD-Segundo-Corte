const router = require('express').Router();
const c = require('../controllers/admin.controller');
const { autenticar, soloAdmin } = require('../middlewares/auth');

router.get('/admin/resumen', autenticar, soloAdmin, c.resumen);
router.get('/suscripciones', autenticar, soloAdmin, c.listarSuscripciones);

module.exports = router;
