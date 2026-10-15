const db = require('../config/db');

const listar = async () => (await db.query('SELECT * FROM planes ORDER BY precio_mensual'))[0];
const buscarPorId = async (id) => (await db.query('SELECT * FROM planes WHERE id_plan = ?', [id]))[0][0];
const buscarPorNombre = async (nombre) => (await db.query('SELECT * FROM planes WHERE nombre = ?', [nombre]))[0][0];

module.exports = { listar, buscarPorId, buscarPorNombre };
