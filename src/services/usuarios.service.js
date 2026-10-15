const HttpError = require('../utils/HttpError');
const usuarios = require('../repositories/usuarios.repository');

const listar = (filtros) => usuarios.listar(filtros);

const obtener = async (id) => {
  const u = await usuarios.buscarPorId(id);
  if (!u) throw new HttpError(404, 'Usuario no encontrado');
  return u;
};

// Lanza 404 si el usuario no existe (lo reutilizan los recursos anidados)
const existir = async (id) => { await obtener(id); };

// RF-14: el usuario edita su perfil; solo el administrador puede cambiar rol y estado
const actualizar = async (id, datos, solicitante) => {
  await existir(id);
  if ((datos.rol !== undefined || datos.estado !== undefined) && solicitante.rol !== 'admin') {
    throw new HttpError(403, 'Solo un administrador puede modificar el rol o el estado de una cuenta');
  }
  await usuarios.actualizar(id, datos);
  return usuarios.buscarPorId(id);
};

// RF-19
const eliminar = async (id, solicitante) => {
  await existir(id);
  if (id === solicitante.id) throw new HttpError(409, 'No puedes eliminar tu propia cuenta');
  await usuarios.eliminar(id);
};

module.exports = { listar, obtener, existir, actualizar, eliminar };
