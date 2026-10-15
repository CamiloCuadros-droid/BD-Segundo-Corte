const admin = require('../repositories/admin.repository');

// RF-15: panel con informacion general
const resumen = () => admin.resumen();

module.exports = { resumen };
