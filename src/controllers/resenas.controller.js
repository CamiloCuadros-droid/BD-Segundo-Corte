const resenas = require('../services/resenas.service');

const actualizar = async (req, res) => res.json(await resenas.actualizar(Number(req.params.id), req.user, req.body));
const eliminar = async (req, res) => { await resenas.eliminar(Number(req.params.id), req.user); res.status(204).end(); };

module.exports = { actualizar, eliminar };
