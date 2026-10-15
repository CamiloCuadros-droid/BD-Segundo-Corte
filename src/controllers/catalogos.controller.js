const catalogos = require('../services/catalogos.service');

// Fabrica de controladores para tipos de cocina y etiquetas
const crearControlador = (servicio) => ({
  listar: async (req, res) => res.json(await servicio.listar()),
  crear: async (req, res) => res.status(201).json(await servicio.crear(req.body.nombre)),
  actualizar: async (req, res) => res.json(await servicio.actualizar(Number(req.params.id), req.body.nombre)),
  eliminar: async (req, res) => { await servicio.eliminar(Number(req.params.id)); res.status(204).end(); },
});

module.exports = {
  tiposCocina: crearControlador(catalogos.tiposCocina),
  etiquetas: crearControlador(catalogos.etiquetas),
  listarPlanes: async (req, res) => res.json(await catalogos.planes.listar()),
};
