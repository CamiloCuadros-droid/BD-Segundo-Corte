const usuarios = require('../services/usuarios.service');
const coleccion = require('../services/coleccion.service');
const preparaciones = require('../services/preparaciones.service');
const suscripciones = require('../services/suscripciones.service');
const cajas = require('../services/cajas.service');

const idUsuario = (req) => Number(req.params.id);

// --- Usuarios ---
const listar = async (req, res) => res.json(await usuarios.listar(req.query));
const obtener = async (req, res) => res.json(await usuarios.obtener(idUsuario(req)));
const actualizar = async (req, res) => res.json(await usuarios.actualizar(idUsuario(req), req.body, req.user));
const eliminar = async (req, res) => { await usuarios.eliminar(idUsuario(req), req.user); res.status(204).end(); };

// --- Coleccion ---
const listarColeccion = async (req, res) => res.json(await coleccion.listar(idUsuario(req)));
const agregarColeccion = async (req, res) =>
  res.status(201).json(await coleccion.agregar(idUsuario(req), req.body.id_receta));
const quitarColeccion = async (req, res) => {
  await coleccion.quitar(idUsuario(req), Number(req.params.idReceta));
  res.status(204).end();
};

// --- Preparaciones y habitos ---
const listarPreparaciones = async (req, res) => res.json(await preparaciones.listar(idUsuario(req)));
const registrarPreparacion = async (req, res) =>
  res.status(201).json(await preparaciones.registrar(idUsuario(req), req.body.id_receta));
const habitos = async (req, res) => res.json(await preparaciones.habitos(idUsuario(req)));

// --- Suscripcion ---
const obtenerSuscripcion = async (req, res) => res.json(await suscripciones.obtenerDeUsuario(idUsuario(req)));
const cambiarPlan = async (req, res) => res.json(await suscripciones.cambiarPlan(idUsuario(req), req.body.id_plan));

// --- Caja semanal ---
const obtenerCaja = async (req, res) => res.json(await cajas.obtener(idUsuario(req), req.query.semana));
const crearCaja = async (req, res) => res.status(201).json(await cajas.crear(idUsuario(req), req.body));
const eliminarCaja = async (req, res) => {
  await cajas.eliminar(idUsuario(req), Number(req.params.idCaja));
  res.status(204).end();
};

module.exports = {
  listar, obtener, actualizar, eliminar,
  listarColeccion, agregarColeccion, quitarColeccion,
  listarPreparaciones, registrarPreparacion, habitos,
  obtenerSuscripcion, cambiarPlan,
  obtenerCaja, crearCaja, eliminarCaja,
};
