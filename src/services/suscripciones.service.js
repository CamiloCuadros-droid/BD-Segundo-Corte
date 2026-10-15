const HttpError = require('../utils/HttpError');
const transaccion = require('../utils/transaccion');
const { hoy, masMeses } = require('../utils/fechas');
const suscripciones = require('../repositories/suscripciones.repository');
const planes = require('../repositories/planes.repository');
const preparaciones = require('../repositories/preparaciones.repository');
const usuarios = require('./usuarios.service');

// RF-11: plan vigente y uso del plan gratuito
const obtenerDeUsuario = async (id_usuario) => {
  await usuarios.existir(id_usuario);
  const sub = await suscripciones.activaDeUsuario(id_usuario);
  if (!sub) throw new HttpError(404, 'El usuario no tiene una suscripción vigente');
  const usadas = await preparaciones.contarMesActual(id_usuario);
  return {
    suscripcion: sub,
    uso: {
      recetas_preparadas_mes: usadas,
      limite_recetas_mes: sub.limite_recetas_mes,
      disponibles: sub.limite_recetas_mes === null ? null : Math.max(0, sub.limite_recetas_mes - usadas),
    },
  };
};

// RF-12: cambio de plan (por ejemplo, de Gratuito a Premium)
const cambiarPlan = async (id_usuario, id_plan) => {
  await usuarios.existir(id_usuario);
  const plan = await planes.buscarPorId(id_plan);
  if (!plan) throw new HttpError(404, 'Plan no encontrado');
  const actual = await suscripciones.activaDeUsuario(id_usuario);
  if (actual && actual.id_plan === id_plan) throw new HttpError(409, `El usuario ya tiene el plan ${plan.nombre}`);

  await transaccion(async (conn) => {
    await suscripciones.cancelarActivas(id_usuario, conn);
    await suscripciones.crear(
      {
        id_usuario,
        id_plan,
        fecha_inicio: hoy(),
        fecha_expiracion: Number(plan.precio_mensual) > 0 ? masMeses(1) : null,
      },
      conn
    );
  });
  return obtenerDeUsuario(id_usuario);
};

// RF-18 (administrador)
const listar = (filtros) => suscripciones.listar(filtros);

module.exports = { obtenerDeUsuario, cambiarPlan, listar };
