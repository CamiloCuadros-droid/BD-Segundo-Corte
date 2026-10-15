const db = require('../config/db');

const ejecutor = (conn) => conn || db;

const crear = async ({ id_usuario, id_plan, fecha_inicio, fecha_expiracion }, conn) => {
  const [r] = await ejecutor(conn).query(
    `INSERT INTO suscripciones (id_usuario, id_plan, estado, fecha_inicio, fecha_expiracion)
     VALUES (?, ?, 'activa', ?, ?)`,
    [id_usuario, id_plan, fecha_inicio, fecha_expiracion || null]
  );
  return r.insertId;
};

// Suscripcion vigente del usuario (activa y no vencida)
const activaDeUsuario = async (id_usuario) => {
  const [rows] = await db.query(
    `SELECT s.id_suscripcion, s.id_usuario, s.id_plan, p.nombre AS plan, p.precio_mensual,
            p.limite_recetas_mes, s.estado, s.fecha_inicio, s.fecha_expiracion
       FROM suscripciones s JOIN planes p ON p.id_plan = s.id_plan
      WHERE s.id_usuario = ? AND s.estado = 'activa'
        AND (s.fecha_expiracion IS NULL OR s.fecha_expiracion >= CURDATE())
      ORDER BY s.id_suscripcion DESC LIMIT 1`,
    [id_usuario]
  );
  return rows[0];
};

const cancelarActivas = async (id_usuario, conn) =>
  ejecutor(conn).query(
    "UPDATE suscripciones SET estado = 'cancelada' WHERE id_usuario = ? AND estado = 'activa'",
    [id_usuario]
  );

const listar = async ({ estado, q }) => {
  const where = [];
  const params = [];
  if (estado) { where.push('s.estado = ?'); params.push(estado); }
  if (q) { where.push('(u.nombre LIKE ? OR u.correo LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  const [rows] = await db.query(
    `SELECT s.id_suscripcion, s.id_usuario, u.nombre AS usuario, u.correo, p.nombre AS plan,
            s.estado, s.fecha_inicio, s.fecha_expiracion
       FROM suscripciones s
       JOIN usuarios u ON u.id_usuario = s.id_usuario
       JOIN planes p ON p.id_plan = s.id_plan
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY s.id_suscripcion DESC`,
    params
  );
  return rows;
};

module.exports = { crear, activaDeUsuario, cancelarActivas, listar };
