const HttpError = require('../utils/HttpError');
const { esFecha } = require('../utils/fechas');

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const verificarCampo = (campo, valor, regla) => {
  const errores = [];
  const falta = valor === undefined || valor === null || (typeof valor === 'string' && valor.trim() === '');

  if (falta) {
    if (regla.requerido) errores.push({ campo, mensaje: 'El campo es obligatorio' });
    return errores;
  }

  switch (regla.tipo) {
    case 'string':
      if (typeof valor !== 'string') return [{ campo, mensaje: 'Debe ser un texto' }];
      if (regla.min && valor.trim().length < regla.min) errores.push({ campo, mensaje: `Debe tener al menos ${regla.min} caracteres` });
      if (regla.max && valor.length > regla.max) errores.push({ campo, mensaje: `Debe tener máximo ${regla.max} caracteres` });
      if (regla.email && !EMAIL.test(valor)) errores.push({ campo, mensaje: 'Debe ser un correo electrónico válido' });
      if (regla.enum && !regla.enum.includes(valor)) errores.push({ campo, mensaje: `Valores permitidos: ${regla.enum.join(', ')}` });
      if (regla.fecha && !esFecha(valor)) errores.push({ campo, mensaje: 'Debe ser una fecha con formato YYYY-MM-DD' });
      break;
    case 'int':
      if (!Number.isInteger(valor)) return [{ campo, mensaje: 'Debe ser un número entero' }];
      if (regla.min !== undefined && valor < regla.min) errores.push({ campo, mensaje: `Debe ser mayor o igual a ${regla.min}` });
      if (regla.max !== undefined && valor > regla.max) errores.push({ campo, mensaje: `Debe ser menor o igual a ${regla.max}` });
      break;
    case 'boolean':
      if (typeof valor !== 'boolean') errores.push({ campo, mensaje: 'Debe ser verdadero o falso (true/false)' });
      break;
    case 'intArray':
      if (!Array.isArray(valor) || !valor.every((n) => Number.isInteger(n) && n > 0)) {
        errores.push({ campo, mensaje: 'Debe ser un arreglo de identificadores enteros positivos' });
      } else if (regla.minItems && valor.length < regla.minItems) {
        errores.push({ campo, mensaje: `Debe incluir al menos ${regla.minItems} elemento(s)` });
      }
      break;
    default:
  }
  return errores;
};

/**
 * Middleware de validacion del cuerpo de la solicitud.
 * @param esquema  { campo: { tipo, requerido, min, max, email, enum, fecha, minItems } }
 * @param opciones { parcial: true } -> para PUT: todos los campos opcionales, pero al menos uno
 *                 { custom: (body) => [{campo, mensaje}] } -> reglas adicionales entre campos
 */
const validar = (esquema, opciones = {}) => (req, res, next) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  let errores = [];

  if (opciones.parcial) {
    const presentes = Object.keys(esquema).filter((c) => body[c] !== undefined);
    if (presentes.length === 0) {
      throw new HttpError(400, 'Datos inválidos', [{ campo: '(cuerpo)', mensaje: `Envía al menos uno de: ${Object.keys(esquema).join(', ')}` }]);
    }
  }

  for (const [campo, regla] of Object.entries(esquema)) {
    const r = opciones.parcial ? { ...regla, requerido: false } : regla;
    errores = errores.concat(verificarCampo(campo, body[campo], r));
  }
  if (opciones.custom && errores.length === 0) errores = errores.concat(opciones.custom(body));

  if (errores.length) throw new HttpError(400, 'Datos inválidos', errores);
  next();
};

// Valida que los parametros de ruta indicados sean enteros positivos
const validarIds = (...nombres) => (req, res, next) => {
  const errores = [];
  for (const n of nombres) {
    if (!/^\d+$/.test(req.params[n] || '') || Number(req.params[n]) < 1) {
      errores.push({ campo: n, mensaje: 'Debe ser un identificador entero positivo' });
    }
  }
  if (errores.length) throw new HttpError(400, 'Parámetros inválidos', errores);
  next();
};

module.exports = { validar, validarIds };
