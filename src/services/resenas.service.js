const HttpError = require('../utils/HttpError');
const transaccion = require('../utils/transaccion');
const resenas = require('../repositories/resenas.repository');
const recetas = require('../repositories/recetas.repository');
const { etiquetas } = require('../repositories/catalogos.repository');

const validarEtiquetas = async (ids) => {
  const unicas = [...new Set(ids)];
  if (unicas.length && (await etiquetas.contarPorIds(unicas)) !== unicas.length) {
    throw new HttpError(400, 'Datos inválidos', [{ campo: 'etiquetas', mensaje: 'Una o más etiquetas no existen' }]);
  }
  return unicas;
};

// RF-09
const listarPorReceta = async (id_receta) => {
  const receta = await recetas.buscarPorId(id_receta);
  if (!receta) throw new HttpError(404, 'Receta no encontrada');
  return {
    receta: { id_receta: receta.id_receta, nombre: receta.nombre },
    resumen: { calificacion_promedio: receta.calificacion_promedio, total_resenas: receta.total_resenas },
    resenas: await resenas.listarPorReceta(id_receta),
  };
};

const obtenerCompleta = async (id_resena, id_receta) =>
  (await resenas.listarPorReceta(id_receta)).find((r) => r.id_resena === id_resena);

// RF-08: una resena por usuario y receta
const crear = async (id_receta, usuario, body) => {
  if (!(await recetas.existe(id_receta))) throw new HttpError(404, 'Receta no encontrada');
  if (await resenas.buscarPorUsuarioYReceta(usuario.id, id_receta)) {
    throw new HttpError(409, 'Ya publicaste una reseña para esta receta; puedes editarla');
  }
  const ids = await validarEtiquetas(body.etiquetas || []);
  const id = await transaccion(async (conn) => {
    const nuevo = await resenas.crear({ ...body, id_usuario: usuario.id, id_receta }, conn);
    await resenas.reemplazarEtiquetas(nuevo, ids, conn);
    return nuevo;
  });
  return obtenerCompleta(id, id_receta);
};

const obtenerPropia = async (id, usuario) => {
  const r = await resenas.buscarPorId(id);
  if (!r) throw new HttpError(404, 'Reseña no encontrada');
  if (r.id_usuario !== usuario.id && usuario.rol !== 'admin') {
    throw new HttpError(403, 'Solo puedes modificar tus propias reseñas');
  }
  return r;
};

const actualizar = async (id, usuario, body) => {
  const actual = await obtenerPropia(id, usuario);
  const ids = body.etiquetas !== undefined ? await validarEtiquetas(body.etiquetas) : null;
  await transaccion(async (conn) => {
    await resenas.actualizar(id, body, conn);
    if (ids) await resenas.reemplazarEtiquetas(id, ids, conn);
  });
  return obtenerCompleta(id, actual.id_receta);
};

const eliminar = async (id, usuario) => {
  await obtenerPropia(id, usuario);
  await resenas.eliminar(id);
};

module.exports = { listarPorReceta, crear, actualizar, eliminar };
