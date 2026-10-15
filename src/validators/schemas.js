const { validar } = require('./validar');

const registro = validar(
  {
    nombre: { tipo: 'string', requerido: true, min: 2, max: 100 },
    correo: { tipo: 'string', requerido: true, email: true, max: 150 },
    contrasena: { tipo: 'string', requerido: true, min: 6, max: 100 },
    confirmar_contrasena: { tipo: 'string', requerido: true },
    acepta_terminos: { tipo: 'boolean', requerido: true },
  },
  {
    custom: (b) => {
      const e = [];
      if (b.contrasena !== b.confirmar_contrasena) e.push({ campo: 'confirmar_contrasena', mensaje: 'Las contraseñas no coinciden' });
      if (b.acepta_terminos !== true) e.push({ campo: 'acepta_terminos', mensaje: 'Debes aceptar los términos y la política de privacidad' });
      return e;
    },
  }
);

const login = validar({
  correo: { tipo: 'string', requerido: true, email: true },
  contrasena: { tipo: 'string', requerido: true },
});

const usuarioActualizar = validar(
  {
    nombre: { tipo: 'string', min: 2, max: 100 },
    correo: { tipo: 'string', email: true, max: 150 },
    contrasena: { tipo: 'string', min: 6, max: 100 },
    rol: { tipo: 'string', enum: ['usuario', 'admin'] },
    estado: { tipo: 'string', enum: ['activo', 'inactivo'] },
  },
  { parcial: true }
);

const recetaCampos = {
  nombre: { tipo: 'string', requerido: true, min: 2, max: 150 },
  id_tipo_cocina: { tipo: 'int', requerido: true, min: 1 },
  dificultad: { tipo: 'string', requerido: true, enum: ['facil', 'media', 'dificil'] },
  tiempo_min: { tipo: 'int', requerido: true, min: 1, max: 1440 },
  descripcion: { tipo: 'string', requerido: true, min: 10 },
  imagen_url: { tipo: 'string', max: 255 },
};
const recetaCrear = validar(recetaCampos);
const recetaActualizar = validar(recetaCampos, { parcial: true });

const resenaCampos = {
  calificacion: { tipo: 'int', requerido: true, min: 1, max: 5 },
  comentario: { tipo: 'string', max: 1000 },
  volveria_a_cocinar: { tipo: 'boolean' },
  etiquetas: { tipo: 'intArray' },
};
const resenaCrear = validar(resenaCampos);
const resenaActualizar = validar(resenaCampos, { parcial: true });

const idReceta = validar({ id_receta: { tipo: 'int', requerido: true, min: 1 } });

const cambioPlan = validar({ id_plan: { tipo: 'int', requerido: true, min: 1 } });

const cajaCrear = validar({
  semana: { tipo: 'string', requerido: true, fecha: true },
  recetas: { tipo: 'intArray', requerido: true, minItems: 1 },
});

const nombreCatalogo = validar({ nombre: { tipo: 'string', requerido: true, min: 2, max: 50 } });

module.exports = {
  registro, login, usuarioActualizar, recetaCrear, recetaActualizar, resenaCrear, resenaActualizar,
  idReceta, cambioPlan, cajaCrear, nombreCatalogo,
};
