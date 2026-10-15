const db = require('../config/db');

const listar = async (id_usuario) =>
  (await db.query(
    `SELECT r.id_receta, r.nombre, tc.nombre AS tipo_cocina, r.dificultad, r.tiempo_min, r.imagen_url, c.fecha_guardado
       FROM colecciones c
       JOIN recetas r ON r.id_receta = c.id_receta
       JOIN tipos_cocina tc ON tc.id_tipo_cocina = r.id_tipo_cocina
      WHERE c.id_usuario = ? ORDER BY c.fecha_guardado DESC`,
    [id_usuario]
  ))[0];

const agregar = async (id_usuario, id_receta) =>
  db.query('INSERT INTO colecciones (id_usuario, id_receta) VALUES (?, ?)', [id_usuario, id_receta]);

const quitar = async (id_usuario, id_receta) =>
  (await db.query('DELETE FROM colecciones WHERE id_usuario = ? AND id_receta = ?', [id_usuario, id_receta]))[0].affectedRows;

module.exports = { listar, agregar, quitar };
