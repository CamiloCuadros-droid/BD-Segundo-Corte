const db = require('../config/db');

// Ejecuta fn(conn) dentro de una transaccion; hace commit o rollback segun el resultado
module.exports = async function transaccion(fn) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const resultado = await fn(conn);
    await conn.commit();
    return resultado;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
