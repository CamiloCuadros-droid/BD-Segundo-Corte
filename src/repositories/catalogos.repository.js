const db = require('../config/db');

// Fabrica de repositorios para tablas simples (id + nombre): tipos_cocina y etiquetas
const crearRepositorio = (tabla, pk) => ({
  listar: async () => (await db.query(`SELECT * FROM ${tabla} ORDER BY nombre`))[0],
  buscarPorId: async (id) => (await db.query(`SELECT * FROM ${tabla} WHERE ${pk} = ?`, [id]))[0][0],
  contarPorIds: async (ids) =>
    (await db.query(`SELECT COUNT(*) AS total FROM ${tabla} WHERE ${pk} IN (?)`, [ids]))[0][0].total,
  crear: async (nombre) => (await db.query(`INSERT INTO ${tabla} (nombre) VALUES (?)`, [nombre]))[0].insertId,
  actualizar: async (id, nombre) =>
    (await db.query(`UPDATE ${tabla} SET nombre = ? WHERE ${pk} = ?`, [nombre, id]))[0].affectedRows,
  eliminar: async (id) => (await db.query(`DELETE FROM ${tabla} WHERE ${pk} = ?`, [id]))[0].affectedRows,
});

module.exports = {
  tiposCocina: crearRepositorio('tipos_cocina', 'id_tipo_cocina'),
  etiquetas: crearRepositorio('etiquetas', 'id_etiqueta'),
};
