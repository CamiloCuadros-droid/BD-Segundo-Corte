const router = require('express').Router();
const c = require('../controllers/recetas.controller');
const v = require('../validators/schemas');
const { validarIds } = require('../validators/validar');
const { autenticar, soloAdmin } = require('../middlewares/auth');

router.use(autenticar);

router.get('/', c.listar);
router.get('/:id', validarIds('id'), c.obtener);
router.post('/', soloAdmin, v.recetaCrear, c.crear);
router.put('/:id', validarIds('id'), soloAdmin, v.recetaActualizar, c.actualizar);
router.delete('/:id', validarIds('id'), soloAdmin, c.eliminar);

// Resenas como recurso anidado de la receta
router.get('/:id/resenas', validarIds('id'), c.listarResenas);
router.post('/:id/resenas', validarIds('id'), v.resenaCrear, c.crearResena);

module.exports = router;
