const express = require('express');
const c = require('../controllers/catalogos.controller');
const v = require('../validators/schemas');
const { validarIds } = require('../validators/validar');
const { autenticar, soloAdmin } = require('../middlewares/auth');

// Catalogos auxiliares: lectura publica, escritura solo administrador
const crearRutasCatalogo = (controlador) => {
  const r = express.Router();
  r.get('/', controlador.listar);
  r.post('/', autenticar, soloAdmin, v.nombreCatalogo, controlador.crear);
  r.put('/:id', autenticar, soloAdmin, validarIds('id'), v.nombreCatalogo, controlador.actualizar);
  r.delete('/:id', autenticar, soloAdmin, validarIds('id'), controlador.eliminar);
  return r;
};

const planes = express.Router();
planes.get('/', c.listarPlanes);

module.exports = {
  tiposCocina: crearRutasCatalogo(c.tiposCocina),
  etiquetas: crearRutasCatalogo(c.etiquetas),
  planes,
};
