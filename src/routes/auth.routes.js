const router = require('express').Router();
const c = require('../controllers/auth.controller');
const v = require('../validators/schemas');

router.post('/registro', v.registro, c.registro);
router.post('/login', v.login, c.login);

module.exports = router;
