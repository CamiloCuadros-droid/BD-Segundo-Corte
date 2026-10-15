const db = require('../config/db');

const resumen = async () => {
  const [[u]] = await db.query("SELECT COUNT(*) AS total, SUM(estado = 'activo') AS activos FROM usuarios");
  const [[r]] = await db.query('SELECT COUNT(*) AS total FROM recetas');
  const [[prep]] = await db.query(
    `SELECT COUNT(*) AS total FROM preparaciones
      WHERE YEAR(fecha_preparacion) = YEAR(CURDATE()) AND MONTH(fecha_preparacion) = MONTH(CURDATE())`
  );
  const [porPlan] = await db.query(
    `SELECT p.nombre AS plan, COUNT(*) AS total
       FROM suscripciones s JOIN planes p ON p.id_plan = s.id_plan
      WHERE s.estado = 'activa' AND (s.fecha_expiracion IS NULL OR s.fecha_expiracion >= CURDATE())
      GROUP BY p.nombre`
  );
  return {
    usuarios: { total: u.total, activos: Number(u.activos || 0) },
    recetas: { total: r.total },
    preparaciones_mes_actual: prep.total,
    suscripciones_activas_por_plan: porPlan,
  };
};

module.exports = { resumen };
