const auth = require('../services/auth.service');

const registro = async (req, res) => res.status(201).json(await auth.registrar(req.body));
const login = async (req, res) => res.json(await auth.login(req.body));

module.exports = { registro, login };
