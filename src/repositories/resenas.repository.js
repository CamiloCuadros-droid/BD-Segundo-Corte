const db = require('../config/db');

const ejecutor = (conn) => conn || db;

const listarPorReceta = async (id_receta) => {
  const [resenas] = await db.query(
    `SELECT rs.id_resena, rs.id_usuario, u.nombre AS usuario, rs.id_receta, rs.calificacion,
            rs.comentario, rs.volveria_a_cocinar, rs.fecha
       FROM resenas rs JOIN usuarios u ON u.id_usuario = rs.id_usuario
      WHERE rs.id_receta = ? ORDER BY rs.fecha DESC`,
    [id_receta]
  );
  if (!resenas.length) return [];
  const [tags] = await db.query(
    `SELECT re.id_resena, e.id_etiqueta, e.nombre
       FROM resena_etiquetas re JOIN etiquetas e ON e.id_etiqueta = re.id_etiqueta
      WHERE re.id_resena IN (?)`,
    [resenas.map((r) => r.id_resena)]
  );
  return resenas.map((r) => ({
    ...r,
    volveria_a_cocinar: !!r.volveria_a_cocinar,
    etiquetas: tags.filter((t) => t.id_resena === r.id_resena).map((t) => ({ id_etiqueta: t.id_etiqueta, nombre: t.nombre })),
  }));
};

const buscarPorId = async (id) => {
  const [rows] = await db.query('SELECT * FROM resenas WHERE id_resena = ?', [id]);
  return rows[0];
};

const buscarPorUsuarioYReceta = async (id_usuario, id_receta) => {
  const [rows] = await db.query('SELECT * FROM resenas WHERE id_usuario = ? AND id_receta = ?', [id_usuario, id_receta]);
  return rows[0];
};

const crear = async ({ id_usuario, id_receta, calificacion, comentario, volveria_a_cocinar }, conn) => {
  const [r] = await ejecutor(conn).query(
    `INSERT INTO resenas (id_usuario, id_receta, calificacion, comentario, volveria_a_cocinar)
     VALUES (?, ?, ?, ?, ?)`,
    [id_usuario, id_receta, calificacion, comentario || null, volveria_a_cocinar === undefined ? true : volveria_a_cocinar]
  );
  return r.insertId;
};

const actualizar = async (id, datos, conn) => {
  const permitidos = ['calificacion', 'comentario', 'volveria_a_cocinar'];
  const campos = Object.keys(datos).filter((c) => permitidos.includes(c));
  if (!campos.length) return 0;
  const [r] = await ejecutor(conn).query(
    `UPDATE resenas SET ${campos.map((c) => `${c} = ?`).join(', ')} WHERE id_resena = ?`,
    [...campos.map((c) => datos[c]), id]
  );
  return r.affectedRows;
};

// Reemplaza el conjunto de etiquetas de una resena
const reemplazarEtiquetas = async (id_resena, ids, conn) => {
  const ex = ejecutor(conn);
  await ex.query('DELETE FROM resena_etiquetas WHERE id_resena = ?', [id_resena]);
  if (ids.length) {
    await ex.query('INSERT INTO resena_etiquetas (id_resena, id_etiqueta) VALUES ?', [ids.map((i) => [id_resena, i])]);
  }
};

const eliminar = async (id) => (await db.query('DELETE FROM resenas WHERE id_resena = ?', [id]))[0].affectedRows;

module.exports = { listarPorReceta, buscarPorId, buscarPorUsuarioYReceta, crear, actualizar, reemplazarEtiquetas, eliminar };
