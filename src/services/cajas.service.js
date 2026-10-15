const HttpError = require('../utils/HttpError');
const transaccion = require('../utils/transaccion');
const { lunesActual, esLunes } = require('../utils/fechas');
const cajas = require('../repositories/cajas.repository');
const recetas = require('../repositories/recetas.repository');
const suscripciones = require('../repositories/suscripciones.repository');
const usuarios = require('./usuarios.service');

// La caja semanal es una funcionalidad exclusiva del plan Premium (HU-12)
const exigirPremium = async (id_usuario) => {
  const sub = await suscripciones.activaDeUsuario(id_usuario);
  if (!sub || sub.plan !== 'Premium') throw new HttpError(403, 'La caja semanal está disponible solo para usuarios Premium');
};

const obtener = async (id_usuario, semanaParam) => {
  await usuarios.existir(id_usuario);
  await exigirPremium(id_usuario);
  const semana = semanaParam || lunesActual();
  if (!esLunes(semana)) {
    throw new HttpError(400, 'Parámetros inválidos', [{ campo: 'semana', mensaje: 'Debe ser una fecha YYYY-MM-DD que corresponda a un lunes' }]);
  }
  const caja = await cajas.buscarPorSemana(id_usuario, semana);
  if (!caja) throw new HttpError(404, `No hay una caja asignada para la semana del ${semana}`);
  return caja;
};

// RF-13 (el administrador asigna la recomendacion semanal)
const crear = async (id_usuario, { semana, recetas: ids }) => {
  await usuarios.existir(id_usuario);
  await exigirPremium(id_usuario);
  if (!esLunes(semana)) {
    throw new HttpError(400, 'Datos inválidos', [{ campo: 'semana', mensaje: 'La semana debe iniciar en lunes' }]);
  }
  const unicas = [...new Set(ids)];
  if ((await recetas.contarPorIds(unicas)) !== unicas.length) {
    throw new HttpError(400, 'Datos inválidos', [{ campo: 'recetas', mensaje: 'Una o más recetas no existen' }]);
  }
  try {
    await transaccion((conn) => cajas.crear(id_usuario, semana, unicas, conn));
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'El usuario ya tiene una caja para esa semana');
    throw e;
  }
  return cajas.buscarPorSemana(id_usuario, semana);
};

const eliminar = async (id_usuario, id_caja) => {
  await usuarios.existir(id_usuario);
  if (!(await cajas.eliminar(id_usuario, id_caja))) throw new HttpError(404, 'Caja no encontrada');
};

module.exports = { obtener, crear, eliminar };
