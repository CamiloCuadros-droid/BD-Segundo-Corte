const recetas = require('../services/recetas.service');
const resenas = require('../services/resenas.service');

const listar = async (req, res) => res.json(await recetas.listar(req.query));
const obtener = async (req, res) => res.json(await recetas.obtener(Number(req.params.id)));
const crear = async (req, res) => res.status(201).json(await recetas.crear(req.body));
const actualizar = async (req, res) => res.json(await recetas.actualizar(Number(req.params.id), req.body));
const eliminar = async (req, res) => { await recetas.eliminar(Number(req.params.id)); res.status(204).end(); };

// Resenas anidadas bajo /recetas/:id/resenas
const listarResenas = async (req, res) => res.json(await resenas.listarPorReceta(Number(req.params.id)));
const crearResena = async (req, res) =>
  res.status(201).json(await resenas.crear(Number(req.params.id), req.user, req.body));

module.exports = { listar, obtener, crear, actualizar, eliminar, listarResenas, crearResena };
