const admin = require('../services/admin.service');
const suscripciones = require('../services/suscripciones.service');

const resumen = async (req, res) => res.json(await admin.resumen());
const listarSuscripciones = async (req, res) => res.json(await suscripciones.listar(req.query));

module.exports = { resumen, listarSuscripciones };
