const router = require('express').Router();
const c = require('../controllers/usuarios.controller');
const v = require('../validators/schemas');
const { validarIds } = require('../validators/validar');
const { autenticar, soloAdmin, propioOAdmin } = require('../middlewares/auth');

router.use(autenticar);

// Usuarios
router.get('/', soloAdmin, c.listar);
router.get('/:id', validarIds('id'), propioOAdmin, c.obtener);
router.put('/:id', validarIds('id'), propioOAdmin, v.usuarioActualizar, c.actualizar);
router.delete('/:id', validarIds('id'), soloAdmin, c.eliminar);

// Recursos anidados del usuario
router.get('/:id/coleccion', validarIds('id'), propioOAdmin, c.listarColeccion);
router.post('/:id/coleccion', validarIds('id'), propioOAdmin, v.idReceta, c.agregarColeccion);
router.delete('/:id/coleccion/:idReceta', validarIds('id', 'idReceta'), propioOAdmin, c.quitarColeccion);

router.get('/:id/preparaciones', validarIds('id'), propioOAdmin, c.listarPreparaciones);
router.post('/:id/preparaciones', validarIds('id'), propioOAdmin, v.idReceta, c.registrarPreparacion);

router.get('/:id/habitos', validarIds('id'), propioOAdmin, c.habitos);

router.get('/:id/suscripcion', validarIds('id'), propioOAdmin, c.obtenerSuscripcion);
router.put('/:id/suscripcion', validarIds('id'), propioOAdmin, v.cambioPlan, c.cambiarPlan);

router.get('/:id/caja-semanal', validarIds('id'), propioOAdmin, c.obtenerCaja);
router.post('/:id/caja-semanal', validarIds('id'), soloAdmin, v.cajaCrear, c.crearCaja);
router.delete('/:id/caja-semanal/:idCaja', validarIds('id', 'idCaja'), soloAdmin, c.eliminarCaja);

module.exports = router;
