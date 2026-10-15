const HttpError = require('../utils/HttpError');
const transaccion = require('../utils/transaccion');
const { hoy } = require('../utils/fechas');
const { firmarToken } = require('../middlewares/auth');
const usuarios = require('../repositories/usuarios.repository');
const planes = require('../repositories/planes.repository');
const suscripciones = require('../repositories/suscripciones.repository');

// RF-01: registro de usuario (la cuenta nace con el plan gratuito)
const registrar = async ({ nombre, correo, contrasena }) => {
  if (await usuarios.buscarPorCorreo(correo)) throw new HttpError(409, 'El correo ya está registrado');
  const gratuito = await planes.buscarPorNombre('Gratuito');

  const id = await transaccion(async (conn) => {
    const idUsuario = await usuarios.crear({ nombre, correo, contrasena }, conn);
    await suscripciones.crear({ id_usuario: idUsuario, id_plan: gratuito.id_plan, fecha_inicio: hoy() }, conn);
    return idUsuario;
  });
  return usuarios.buscarPorId(id);
};

// RF-02: inicio de sesion. El mensaje es el mismo si falla el correo o la contrasena (HU-02)
const login = async ({ correo, contrasena }) => {
  const usuario = await usuarios.buscarPorCorreo(correo);
  if (!usuario || usuario.contrasena !== contrasena) throw new HttpError(401, 'Credenciales inválidas');
  if (usuario.estado !== 'activo') throw new HttpError(403, 'La cuenta se encuentra inactiva');
  return {
    token: firmarToken(usuario),
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
  };
};

module.exports = { registrar, login };
