const db = require('../config/db');

const listar = async (id_usuario) =>
  (await db.query(
    `SELECT p.id_preparacion, p.id_receta, r.nombre AS receta, tc.nombre AS tipo_cocina, p.fecha_preparacion
       FROM preparaciones p
       JOIN recetas r ON r.id_receta = p.id_receta
       JOIN tipos_cocina tc ON tc.id_tipo_cocina = r.id_tipo_cocina
      WHERE p.id_usuario = ? ORDER BY p.fecha_preparacion DESC, p.id_preparacion DESC`,
    [id_usuario]
  ))[0];

const crear = async (id_usuario, id_receta) => {
  const [r] = await db.query('INSERT INTO preparaciones (id_usuario, id_receta) VALUES (?, ?)', [id_usuario, id_receta]);
  return r.insertId;
};

const buscarPorId = async (id) =>
  (await db.query(
    `SELECT p.id_preparacion, p.id_usuario, p.id_receta, r.nombre AS receta, p.fecha_preparacion
       FROM preparaciones p JOIN recetas r ON r.id_receta = p.id_receta WHERE p.id_preparacion = ?`,
    [id]
  ))[0][0];

const contarMesActual = async (id_usuario) =>
  (await db.query(
    `SELECT COUNT(*) AS total FROM preparaciones
      WHERE id_usuario = ? AND YEAR(fecha_preparacion) = YEAR(CURDATE()) AND MONTH(fecha_preparacion) = MONTH(CURDATE())`,
    [id_usuario]
  ))[0][0].total;

// Indicadores de habitos (RF-10): se calculan a partir de las preparaciones
const porMes = async (id_usuario) =>
  (await db.query(
    `SELECT DATE_FORMAT(fecha_preparacion, '%Y-%m') AS mes, COUNT(*) AS total
       FROM preparaciones WHERE id_usuario = ?
      GROUP BY DATE_FORMAT(fecha_preparacion, '%Y-%m') ORDER BY mes DESC LIMIT 6`,
    [id_usuario]
  ))[0];

const porCocina = async (id_usuario) =>
  (await db.query(
    `SELECT tc.nombre AS tipo_cocina, COUNT(*) AS total
       FROM preparaciones p
       JOIN recetas r ON r.id_receta = p.id_receta
       JOIN tipos_cocina tc ON tc.id_tipo_cocina = r.id_tipo_cocina
      WHERE p.id_usuario = ? GROUP BY tc.nombre ORDER BY total DESC`,
    [id_usuario]
  ))[0];

const diasConActividad = async (id_usuario) =>
  (await db.query(
    'SELECT DISTINCT DATE(fecha_preparacion) AS dia FROM preparaciones WHERE id_usuario = ? ORDER BY dia DESC',
    [id_usuario]
  ))[0].map((r) => r.dia);

const recientes = async (id_usuario, limite = 5) =>
  (await db.query(
    `SELECT p.id_receta, r.nombre AS receta, p.fecha_preparacion
       FROM preparaciones p JOIN recetas r ON r.id_receta = p.id_receta
      WHERE p.id_usuario = ? ORDER BY p.fecha_preparacion DESC, p.id_preparacion DESC LIMIT ?`,
    [id_usuario, limite]
  ))[0];

module.exports = { listar, crear, buscarPorId, contarMesActual, porMes, porCocina, diasConActividad, recientes };
