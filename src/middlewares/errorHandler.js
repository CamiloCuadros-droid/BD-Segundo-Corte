const HttpError = require('../utils/HttpError');

const noEncontrado = (req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

// Manejador central de errores (se registra al final de la cadena de middlewares)
// eslint-disable-next-line no-unused-vars
const manejarErrores = (err, req, res, next) => {
  if (err instanceof HttpError) {
    const cuerpo = { error: err.message };
    if (err.detalles) cuerpo.detalles = err.detalles;
    return res.status(err.status).json(cuerpo);
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'El cuerpo de la solicitud no es un JSON válido' });
  }
  // Errores de MySQL traducidos a respuestas HTTP
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos (valor duplicado)' });
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ error: 'Referencia inválida: el recurso relacionado no existe' });
  }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: 'No se puede eliminar: el recurso está siendo usado por otros registros' });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
};

module.exports = { noEncontrado, manejarErrores };
