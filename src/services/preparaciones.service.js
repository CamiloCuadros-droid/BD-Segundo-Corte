const HttpError = require('../utils/HttpError');
const { hoy, aDia } = require('../utils/fechas');
const preparaciones = require('../repositories/preparaciones.repository');
const recetas = require('../repositories/recetas.repository');
const suscripciones = require('../repositories/suscripciones.repository');
const planes = require('../repositories/planes.repository');
const usuarios = require('./usuarios.service');

const listar = async (id_usuario) => {
  await usuarios.existir(id_usuario);
  return preparaciones.listar(id_usuario);
};

// RF-07 con la restriccion del plan: el plan gratuito tiene un limite mensual de recetas
const registrar = async (id_usuario, id_receta) => {
  await usuarios.existir(id_usuario);
  if (!(await recetas.existe(id_receta))) throw new HttpError(404, 'Receta no encontrada');

  const plan = (await suscripciones.activaDeUsuario(id_usuario)) || (await planes.buscarPorNombre('Gratuito'));
  if (plan.limite_recetas_mes !== null) {
    const usadas = await preparaciones.contarMesActual(id_usuario);
    if (usadas >= plan.limite_recetas_mes) {
      throw new HttpError(403, `Alcanzaste el límite de ${plan.limite_recetas_mes} recetas al mes del plan ${plan.nombre ?? plan.plan}. Actualiza a Premium para continuar`);
    }
  }
  return preparaciones.buscarPorId(await preparaciones.crear(id_usuario, id_receta));
};

// Racha: dias consecutivos con actividad, contando hasta hoy (o hasta ayer)
const calcularRacha = (dias) => {
  if (!dias.length) return 0;
  const hoyN = aDia(hoy());
  let esperado = aDia(dias[0]);
  if (esperado < hoyN - 1) return 0;
  let racha = 0;
  for (const d of dias) {
    if (aDia(d) === esperado) { racha += 1; esperado -= 1; } else break;
  }
  return racha;
};

// RF-10: indicadores derivados (no existe una tabla de habitos)
const habitos = async (id_usuario) => {
  await usuarios.existir(id_usuario);
  const [mesActual, porMes, porCocina, dias, recientes] = await Promise.all([
    preparaciones.contarMesActual(id_usuario),
    preparaciones.porMes(id_usuario),
    preparaciones.porCocina(id_usuario),
    preparaciones.diasConActividad(id_usuario),
    preparaciones.recientes(id_usuario),
  ]);
  return {
    recetas_preparadas_mes_actual: mesActual,
    preparaciones_por_mes: porMes,
    distribucion_por_cocina: porCocina,
    racha_dias: calcularRacha(dias),
    actividad_reciente: recientes,
  };
};

module.exports = { listar, registrar, habitos };
