const HttpError = require('../utils/HttpError');
const coleccion = require('../repositories/coleccion.repository');
const recetas = require('../repositories/recetas.repository');
const usuarios = require('./usuarios.service');

const listar = async (id_usuario) => {
  await usuarios.existir(id_usuario);
  return coleccion.listar(id_usuario);
};

// RF-06
const agregar = async (id_usuario, id_receta) => {
  await usuarios.existir(id_usuario);
  if (!(await recetas.existe(id_receta))) throw new HttpError(404, 'Receta no encontrada');
  try {
    await coleccion.agregar(id_usuario, id_receta);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'La receta ya está en tu colección');
    throw e;
  }
  return (await coleccion.listar(id_usuario)).find((r) => r.id_receta === id_receta);
};

const quitar = async (id_usuario, id_receta) => {
  await usuarios.existir(id_usuario);
  if (!(await coleccion.quitar(id_usuario, id_receta))) throw new HttpError(404, 'La receta no está en la colección');
};

module.exports = { listar, agregar, quitar };
