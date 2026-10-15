const db = require('../config/db');

const SELECT_BASE = `
  SELECT r.id_receta, r.nombre, r.id_tipo_cocina, tc.nombre AS tipo_cocina, r.dificultad,
         r.tiempo_min, r.descripcion, r.imagen_url, r.fecha_creacion,
         ROUND(AVG(rs.calificacion), 1) AS calificacion_promedio,
         COUNT(rs.id_resena) AS total_resenas
    FROM recetas r
    JOIN tipos_cocina tc ON tc.id_tipo_cocina = r.id_tipo_cocina
    LEFT JOIN resenas rs ON rs.id_receta = r.id_receta`;

const construirFiltros = ({ q, cocina, dificultad }) => {
  const where = [];
  const params = [];
  if (q) { where.push('(r.nombre LIKE ? OR r.descripcion LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (cocina) { where.push('tc.nombre = ?'); params.push(cocina); }
  if (dificultad) { where.push('r.dificultad = ?'); params.push(dificultad); }
  return { clausula: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
};

const listar = async (filtros, limite, offset) => {
  const { clausula, params } = construirFiltros(filtros);
  const [rows] = await db.query(
    `${SELECT_BASE} ${clausula} GROUP BY r.id_receta, tc.nombre ORDER BY r.nombre LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );
  return rows;
};

const contar = async (filtros) => {
  const { clausula, params } = construirFiltros(filtros);
  const [rows] = await db.query(
    `SELECT COUNT(*) AS total FROM recetas r JOIN tipos_cocina tc ON tc.id_tipo_cocina = r.id_tipo_cocina ${clausula}`,
    params
  );
  return rows[0].total;
};

const buscarPorId = async (id) => {
  const [rows] = await db.query(`${SELECT_BASE} WHERE r.id_receta = ? GROUP BY r.id_receta, tc.nombre`, [id]);
  return rows[0];
};

const existe = async (id) => {
  const [rows] = await db.query('SELECT 1 FROM recetas WHERE id_receta = ?', [id]);
  return rows.length > 0;
};

const contarPorIds = async (ids) =>
  (await db.query('SELECT COUNT(*) AS total FROM recetas WHERE id_receta IN (?)', [ids]))[0][0].total;

const crear = async ({ nombre, id_tipo_cocina, dificultad, tiempo_min, descripcion, imagen_url }) => {
  const [r] = await db.query(
    `INSERT INTO recetas (nombre, id_tipo_cocina, dificultad, tiempo_min, descripcion, imagen_url)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [nombre, id_tipo_cocina, dificultad, tiempo_min, descripcion, imagen_url || null]
  );
  return r.insertId;
};

const actualizar = async (id, datos) => {
  const permitidos = ['nombre', 'id_tipo_cocina', 'dificultad', 'tiempo_min', 'descripcion', 'imagen_url'];
  const campos = Object.keys(datos).filter((c) => permitidos.includes(c));
  if (!campos.length) return 0;
  const [r] = await db.query(
    `UPDATE recetas SET ${campos.map((c) => `${c} = ?`).join(', ')} WHERE id_receta = ?`,
    [...campos.map((c) => datos[c]), id]
  );
  return r.affectedRows;
};

const eliminar = async (id) => (await db.query('DELETE FROM recetas WHERE id_receta = ?', [id]))[0].affectedRows;

module.exports = { listar, contar, buscarPorId, existe, contarPorIds, crear, actualizar, eliminar };
