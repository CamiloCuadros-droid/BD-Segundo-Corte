const HttpError = require('../utils/HttpError');
const planes = require('../repositories/planes.repository');
const { tiposCocina, etiquetas } = require('../repositories/catalogos.repository');

const crearServicio = (repo, etiqueta) => ({
  listar: () => repo.listar(),
  crear: async (nombre) => repo.buscarPorId(await repo.crear(nombre)),
  actualizar: async (id, nombre) => {
    if (!(await repo.buscarPorId(id))) throw new HttpError(404, `${etiqueta} no encontrado(a)`);
    await repo.actualizar(id, nombre);
    return repo.buscarPorId(id);
  },
  eliminar: async (id) => {
    if (!(await repo.buscarPorId(id))) throw new HttpError(404, `${etiqueta} no encontrado(a)`);
    await repo.eliminar(id);
  },
});

module.exports = {
  tiposCocina: crearServicio(tiposCocina, 'Tipo de cocina'),
  etiquetas: crearServicio(etiquetas, 'Etiqueta'),
  planes: { listar: () => planes.listar() },
};
