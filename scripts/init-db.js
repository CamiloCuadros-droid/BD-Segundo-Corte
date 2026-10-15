// Crea la base de datos y carga los datos iniciales a partir de database/schema.sql
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });
  const sql = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  await conn.query(sql);
  await conn.end();
  console.log('Base de datos "tastebox" creada y poblada correctamente.');
})().catch((e) => { console.error('Error al inicializar la BD:', e.message); process.exit(1); });
