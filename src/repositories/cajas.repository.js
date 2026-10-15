const db = require('../config/db');

const ejecutor = (conn) => conn || db;

const buscarPorSemana = async (id_usuario, semana) => {
  const [cajas] = await db.query('SELECT * FROM cajas_semanales WHERE id_usuario = ? AND semana = ?', [id_usuario, semana]);
  if (!cajas[0]) return undefined;
  const [recetas] = await db.query(
    `SELECT r.id_receta, r.nombre, tc.nombre AS tipo_cocina, r.dificultad, r.tiempo_min
       FROM caja_recetas cr
       JOIN recetas r ON r.id_receta = cr.id_receta
       JOIN tipos_cocina tc ON tc.id_tipo_cocina = r.id_tipo_cocina
      WHERE cr.id_caja = ?`,
    [cajas[0].id_caja]
  );
  return { ...cajas[0], recetas };
};

const crear = async (id_usuario, semana, ids, conn) => {
  const ex = ejecutor(conn);
  const [r] = await ex.query('INSERT INTO cajas_semanales (id_usuario, semana) VALUES (?, ?)', [id_usuario, semana]);
  await ex.query('INSERT INTO caja_recetas (id_caja, id_receta) VALUES ?', [ids.map((i) => [r.insertId, i])]);
  return r.insertId;
};

const eliminar = async (id_usuario, id_caja) =>
  (await db.query('DELETE FROM cajas_semanales WHERE id_caja = ? AND id_usuario = ?', [id_caja, id_usuario]))[0].affectedRows;

module.exports = { buscarPorSemana, crear, eliminar };
