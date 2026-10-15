const HttpError = require('../utils/HttpError');
const recetas = require('../repositories/recetas.repository');
const { tiposCocina } = require('../repositories/catalogos.repository');

// RF-03 y RF-04: catalogo con busqueda, filtros y paginacion
const listar = async (query) => {
  const pagina = Math.max(1, parseInt(query.pagina, 10) || 1);
  const limite = Math.min(50, Math.max(1, parseInt(query.limite, 10) || 10));
  const filtros = { q: query.q, cocina: query.cocina, dificultad: query.dificultad };
  const [datos, total] = await Promise.all([
    recetas.listar(filtros, limite, (pagina - 1) * limite),
    recetas.contar(filtros),
  ]);
  return { datos, pagina, limite, total };
};

// RF-05
const obtener = async (id) => {
  const r = await recetas.buscarPorId(id);
  if (!r) throw new HttpError(404, 'Receta no encontrada');
  return r;
};

const validarTipoCocina = async (id) => {
  if (!(await tiposCocina.buscarPorId(id))) {
    throw new HttpError(400, 'Datos inválidos', [{ campo: 'id_tipo_cocina', mensaje: 'El tipo de cocina indicado no existe' }]);
  }
};

// RF-16
const crear = async (datos) => {
  await validarTipoCocina(datos.id_tipo_cocina);
  return obtener(await recetas.crear(datos));
};

// RF-17
const actualizar = async (id, datos) => {
  await obtener(id);
  if (datos.id_tipo_cocina !== undefined) await validarTipoCocina(datos.id_tipo_cocina);
  await recetas.actualizar(id, datos);
  return obtener(id);
};

const eliminar = async (id) => {
  await obtener(id);
  await recetas.eliminar(id);
};

module.exports = { listar, obtener, crear, actualizar, eliminar };
