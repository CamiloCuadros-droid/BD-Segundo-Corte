const jwt = require('jsonwebtoken');
const HttpError = require('../utils/HttpError');

const SECRET = process.env.JWT_SECRET || 'secreto_de_desarrollo';

// Exige un token JWT valido en Authorization: Bearer <token>
const autenticar = (req, res, next) => {
  const cabecera = req.headers.authorization || '';
  const [tipo, token] = cabecera.split(' ');
  if (tipo !== 'Bearer' || !token) {
    throw new HttpError(401, 'Se requiere autenticación: envía el encabezado Authorization: Bearer <token>');
  }
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.id, rol: payload.rol };
    next();
  } catch {
    throw new HttpError(401, 'Token inválido o expirado');
  }
};

// Solo cuentas con rol administrador (RNF-04)
const soloAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') throw new HttpError(403, 'Acceso restringido a administradores');
  next();
};

// El recurso pertenece al usuario autenticado o es un administrador
const propioOAdmin = (req, res, next) => {
  if (req.user.rol === 'admin' || Number(req.params.id) === req.user.id) return next();
  throw new HttpError(403, 'No tienes permiso para acceder a los recursos de otro usuario');
};

const firmarToken = (usuario) =>
  jwt.sign({ id: usuario.id_usuario, rol: usuario.rol }, SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

module.exports = { autenticar, soloAdmin, propioOAdmin, firmarToken };
