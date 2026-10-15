const router = require('express').Router();
const c = require('../controllers/resenas.controller');
const v = require('../validators/schemas');
const { validarIds } = require('../validators/validar');
const { autenticar } = require('../middlewares/auth');

router.use(autenticar);

router.put('/:id', validarIds('id'), v.resenaActualizar, c.actualizar);
router.delete('/:id', validarIds('id'), c.eliminar);

module.exports = router;
