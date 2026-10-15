const db = require('../config/db');

const COLUMNAS = 'id_usuario, nombre, correo, rol, estado, fecha_registro';
const ejecutor = (conn) => conn || db;

const buscarPorCorreo = async (correo) => {
  const [rows] = await db.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
  return rows[0];
};

const buscarPorId = async (id) => {
  const [rows] = await db.query(`SELECT ${COLUMNAS} FROM usuarios WHERE id_usuario = ?`, [id]);
  return rows[0];
};

const listar = async ({ q, estado, rol }) => {
  const where = [];
  const params = [];
  if (q) { where.push('(u.nombre LIKE ? OR u.correo LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (estado) { where.push('u.estado = ?'); params.push(estado); }
  if (rol) { where.push('u.rol = ?'); params.push(rol); }
  const [rows] = await db.query(
    `SELECT u.id_usuario, u.nombre, u.correo, u.rol, u.estado, u.fecha_registro,
            (SELECT p.nombre FROM suscripciones s JOIN planes p ON p.id_plan = s.id_plan
              WHERE s.id_usuario = u.id_usuario AND s.estado = 'activa'
                AND (s.fecha_expiracion IS NULL OR s.fecha_expiracion >= CURDATE())
              ORDER BY s.id_suscripcion DESC LIMIT 1) AS plan
       FROM usuarios u
       ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY u.id_usuario`,
    params
  );
  return rows;
};

const crear = async ({ nombre, correo, contrasena, rol = 'usuario' }, conn) => {
  const [r] = await ejecutor(conn).query(
    'INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, ?)',
    [nombre, correo, contrasena, rol]
  );
  return r.insertId;
};

const actualizar = async (id, datos) => {
  const permitidos = ['nombre', 'correo', 'contrasena', 'rol', 'estado'];
  const campos = Object.keys(datos).filter((c) => permitidos.includes(c));
  if (!campos.length) return 0;
  const [r] = await db.query(
    `UPDATE usuarios SET ${campos.map((c) => `${c} = ?`).join(', ')} WHERE id_usuario = ?`,
    [...campos.map((c) => datos[c]), id]
  );
  return r.affectedRows;
};

const eliminar = async (id) => {
  const [r] = await db.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
  return r.affectedRows;
};

module.exports = { buscarPorCorreo, buscarPorId, listar, crear, actualizar, eliminar };
