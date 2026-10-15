// Especificacion OpenAPI 3.0 de la API de TasteBox (se sirve con Swagger UI en /api-docs)

const ref = (n) => ({ $ref: `#/components/schemas/${n}` });
const json = (schema, example) => ({ 'application/json': { schema, ...(example ? { example } : {}) } });

// Respuestas de error reutilizables 
const ejemploError = (msg) => ({ error: msg });
const R = {
  400: { description: 'Datos o parámetros inválidos', content: json(ref('ErrorValidacion'), {
    error: 'Datos inválidos', detalles: [{ campo: 'correo', mensaje: 'Debe ser un correo electrónico válido' }] }) },
  401: { description: 'No autenticado: falta el token o es inválido/expirado', content: json(ref('Error'), ejemploError('Token inválido o expirado')) },
  403: { description: 'Sin permisos para realizar la operación', content: json(ref('Error'), ejemploError('Acceso restringido a administradores')) },
  404: { description: 'Recurso no encontrado', content: json(ref('Error'), ejemploError('Recurso no encontrado')) },
  409: { description: 'Conflicto con el estado actual (duplicado o regla de negocio)', content: json(ref('Error'), ejemploError('Ya existe un registro con esos datos (valor duplicado)')) },
};

const idParam = (nombre = 'id', desc = 'Identificador') => ({
  name: nombre, in: 'path', required: true, description: desc, schema: { type: 'integer', minimum: 1, example: 1 },
});
const query = (nombre, desc, schema = { type: 'string' }) => ({ name: nombre, in: 'query', required: false, description: desc, schema });

/**
 * Construye una operacion.
 * ok: [codigo, descripcion, schema?, ejemplo?]   errores: [codigos]
 */
const op = ({ tags, resumen, descripcion, publico = false, params = [], cuerpo, ejemploCuerpo, ok, errores = [] }) => {
  const [codigo, descOk, schemaOk, ejemploOk] = ok;
  const responses = {
    [codigo]: schemaOk ? { description: descOk, content: json(schemaOk, ejemploOk) } : { description: descOk },
  };
  const lista = new Set(errores);
  if (!publico) lista.add(401);
  lista.forEach((e) => { responses[e] = R[e]; });
  return {
    tags, summary: resumen, ...(descripcion ? { description: descripcion } : {}),
    ...(publico ? {} : { security: [{ bearerAuth: [] }] }),
    ...(params.length ? { parameters: params } : {}),
    ...(cuerpo ? { requestBody: { required: true, content: json(cuerpo, ejemploCuerpo) } } : {}),
    responses,
  };
};

const arr = (n) => ({ type: 'array', items: ref(n) });

const spec = {
  openapi: '3.0.3',
  info: {
    title: 'TasteBox API',
    version: '2.0.0',
    description:
      'API REST de TasteBox: catálogo de recetas, colecciones, preparaciones, reseñas, hábitos, suscripciones y administración.\n\n' +
      '**Autenticación:** inicia sesión en `POST /auth/login`, copia el `token` y pulsa **Authorize** (candado) para pegarlo. ' +
      'Cuenta de administrador de prueba: `admin@tastebox.com` / `admin123`.\n\n' +
      '**Convenciones:** los errores tienen la forma `{ "error": "mensaje" }`; los errores de validación incluyen `detalles` por campo. ' +
      'Las contraseñas se almacenan en texto plano únicamente en este corte.',
  },
  servers: [{ url: 'http://localhost:5000', description: 'Servidor local' }],
  tags: [
    { name: 'Auth', description: 'Registro e inicio de sesión' },
    { name: 'Usuarios', description: 'Gestión de cuentas y perfil' },
    { name: 'Recetas', description: 'Catálogo de recetas' },
    { name: 'Reseñas', description: 'Valoraciones y comentarios de recetas' },
    { name: 'Colección', description: 'Recetas guardadas por el usuario' },
    { name: 'Preparaciones y hábitos', description: 'Recetas preparadas e indicadores de hábitos' },
    { name: 'Suscripciones', description: 'Planes y suscripción del usuario' },
    { name: 'Caja semanal', description: 'Recomendación semanal (solo Premium)' },
    { name: 'Catálogos', description: 'Tipos de cocina, etiquetas y planes' },
    { name: 'Administración', description: 'Panel y consulta de suscripciones' },
  ],
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    schemas: {
      Error: { type: 'object', properties: { error: { type: 'string' } }, required: ['error'] },
      ErrorValidacion: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Datos inválidos' },
          detalles: { type: 'array', items: { type: 'object', properties: { campo: { type: 'string' }, mensaje: { type: 'string' } } } },
        },
      },
      Usuario: {
        type: 'object',
        properties: {
          id_usuario: { type: 'integer', example: 2 }, nombre: { type: 'string', example: 'Ana Gómez' },
          correo: { type: 'string', example: 'ana@correo.com' }, rol: { type: 'string', enum: ['usuario', 'admin'] },
          estado: { type: 'string', enum: ['activo', 'inactivo'] }, fecha_registro: { type: 'string', example: '2026-10-14 09:30:00' },
          plan: { type: 'string', example: 'Gratuito', description: 'Solo en el listado de administración' },
        },
      },
      RegistroInput: {
        type: 'object', required: ['nombre', 'correo', 'contrasena', 'confirmar_contrasena', 'acepta_terminos'],
        properties: {
          nombre: { type: 'string', minLength: 2, example: 'Ana Gómez' }, correo: { type: 'string', format: 'email', example: 'ana@correo.com' },
          contrasena: { type: 'string', minLength: 6, example: 'secreto123' }, confirmar_contrasena: { type: 'string', example: 'secreto123' },
          acepta_terminos: { type: 'boolean', example: true },
        },
      },
      LoginInput: {
        type: 'object', required: ['correo', 'contrasena'],
        properties: { correo: { type: 'string', format: 'email', example: 'admin@tastebox.com' }, contrasena: { type: 'string', example: 'admin123' } },
      },
      LoginRespuesta: {
        type: 'object',
        properties: { token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }, usuario: ref('Usuario') },
      },
      UsuarioUpdate: {
        type: 'object', description: 'Al menos un campo. `rol` y `estado` solo los puede modificar un administrador.',
        properties: {
          nombre: { type: 'string' }, correo: { type: 'string', format: 'email' }, contrasena: { type: 'string', minLength: 6 },
          rol: { type: 'string', enum: ['usuario', 'admin'] }, estado: { type: 'string', enum: ['activo', 'inactivo'] },
        },
      },
      Receta: {
        type: 'object',
        properties: {
          id_receta: { type: 'integer', example: 1 }, nombre: { type: 'string', example: 'Pasta Carbonara' },
          id_tipo_cocina: { type: 'integer', example: 1 }, tipo_cocina: { type: 'string', example: 'Italiana' },
          dificultad: { type: 'string', enum: ['facil', 'media', 'dificil'] }, tiempo_min: { type: 'integer', example: 30 },
          descripcion: { type: 'string' }, imagen_url: { type: 'string', nullable: true },
          fecha_creacion: { type: 'string' }, calificacion_promedio: { type: 'string', nullable: true, example: '4.5' },
          total_resenas: { type: 'integer', example: 2 },
        },
      },
      RecetaInput: {
        type: 'object', required: ['nombre', 'id_tipo_cocina', 'dificultad', 'tiempo_min', 'descripcion'],
        properties: {
          nombre: { type: 'string', example: 'Arepas rellenas' }, id_tipo_cocina: { type: 'integer', example: 3 },
          dificultad: { type: 'string', enum: ['facil', 'media', 'dificil'], example: 'facil' },
          tiempo_min: { type: 'integer', minimum: 1, example: 25 },
          descripcion: { type: 'string', minLength: 10, example: 'Arepas de maíz rellenas de queso y pollo desmechado.' },
          imagen_url: { type: 'string', example: 'https://ejemplo.com/arepas.jpg' },
        },
      },
      RecetasPagina: {
        type: 'object',
        properties: { datos: arr('Receta'), pagina: { type: 'integer', example: 1 }, limite: { type: 'integer', example: 10 }, total: { type: 'integer', example: 3 } },
      },
      Etiqueta: { type: 'object', properties: { id_etiqueta: { type: 'integer', example: 1 }, nombre: { type: 'string', example: 'Rápida' } } },
      TipoCocina: { type: 'object', properties: { id_tipo_cocina: { type: 'integer', example: 1 }, nombre: { type: 'string', example: 'Italiana' } } },
      NombreInput: { type: 'object', required: ['nombre'], properties: { nombre: { type: 'string', minLength: 2, maxLength: 50, example: 'Vegana' } } },
      Plan: {
        type: 'object',
        properties: {
          id_plan: { type: 'integer', example: 2 }, nombre: { type: 'string', example: 'Premium' },
          precio_mensual: { type: 'string', example: '29900.00' }, limite_recetas_mes: { type: 'integer', nullable: true, example: null },
        },
      },
      Resena: {
        type: 'object',
        properties: {
          id_resena: { type: 'integer', example: 1 }, id_usuario: { type: 'integer', example: 2 }, usuario: { type: 'string', example: 'Ana Gómez' },
          id_receta: { type: 'integer', example: 1 }, calificacion: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
          comentario: { type: 'string', nullable: true, example: 'Quedó deliciosa' }, volveria_a_cocinar: { type: 'boolean', example: true },
          fecha: { type: 'string' }, etiquetas: arr('Etiqueta'),
        },
      },
      ResenaInput: {
        type: 'object', required: ['calificacion'],
        properties: {
          calificacion: { type: 'integer', minimum: 1, maximum: 5, example: 5 }, comentario: { type: 'string', example: 'Quedó deliciosa' },
          volveria_a_cocinar: { type: 'boolean', example: true }, etiquetas: { type: 'array', items: { type: 'integer' }, example: [1, 3] },
        },
      },
      ResenasReceta: {
        type: 'object',
        properties: {
          receta: { type: 'object', properties: { id_receta: { type: 'integer' }, nombre: { type: 'string' } } },
          resumen: { type: 'object', properties: { calificacion_promedio: { type: 'string', nullable: true, example: '4.5' }, total_resenas: { type: 'integer', example: 2 } } },
          resenas: arr('Resena'),
        },
      },
      IdRecetaInput: { type: 'object', required: ['id_receta'], properties: { id_receta: { type: 'integer', minimum: 1, example: 1 } } },
      RecetaColeccion: {
        type: 'object',
        properties: {
          id_receta: { type: 'integer' }, nombre: { type: 'string' }, tipo_cocina: { type: 'string' }, dificultad: { type: 'string' },
          tiempo_min: { type: 'integer' }, imagen_url: { type: 'string', nullable: true }, fecha_guardado: { type: 'string' },
        },
      },
      Preparacion: {
        type: 'object',
        properties: {
          id_preparacion: { type: 'integer', example: 1 }, id_receta: { type: 'integer', example: 1 }, receta: { type: 'string', example: 'Pasta Carbonara' },
          tipo_cocina: { type: 'string', example: 'Italiana' }, fecha_preparacion: { type: 'string', example: '2026-10-14 12:00:00' },
        },
      },
      Habitos: {
        type: 'object',
        properties: {
          recetas_preparadas_mes_actual: { type: 'integer', example: 3 },
          preparaciones_por_mes: { type: 'array', items: { type: 'object', properties: { mes: { type: 'string', example: '2026-10' }, total: { type: 'integer' } } } },
          distribucion_por_cocina: { type: 'array', items: { type: 'object', properties: { tipo_cocina: { type: 'string' }, total: { type: 'integer' } } } },
          racha_dias: { type: 'integer', example: 2 },
          actividad_reciente: { type: 'array', items: { type: 'object', properties: { id_receta: { type: 'integer' }, receta: { type: 'string' }, fecha_preparacion: { type: 'string' } } } },
        },
      },
      CambioPlanInput: { type: 'object', required: ['id_plan'], properties: { id_plan: { type: 'integer', minimum: 1, example: 2 } } },
      SuscripcionUsuario: {
        type: 'object',
        properties: {
          suscripcion: {
            type: 'object',
            properties: {
              id_suscripcion: { type: 'integer' }, id_usuario: { type: 'integer' }, id_plan: { type: 'integer' }, plan: { type: 'string', example: 'Gratuito' },
              precio_mensual: { type: 'string' }, limite_recetas_mes: { type: 'integer', nullable: true }, estado: { type: 'string', example: 'activa' },
              fecha_inicio: { type: 'string', example: '2026-10-14' }, fecha_expiracion: { type: 'string', nullable: true },
            },
          },
          uso: {
            type: 'object',
            properties: {
              recetas_preparadas_mes: { type: 'integer', example: 2 }, limite_recetas_mes: { type: 'integer', nullable: true, example: 5 },
              disponibles: { type: 'integer', nullable: true, example: 3 },
            },
          },
        },
      },
      SuscripcionAdmin: {
        type: 'object',
        properties: {
          id_suscripcion: { type: 'integer' }, id_usuario: { type: 'integer' }, usuario: { type: 'string' }, correo: { type: 'string' },
          plan: { type: 'string' }, estado: { type: 'string', enum: ['activa', 'vencida', 'cancelada'] },
          fecha_inicio: { type: 'string' }, fecha_expiracion: { type: 'string', nullable: true },
        },
      },
      CajaInput: {
        type: 'object', required: ['semana', 'recetas'],
        properties: {
          semana: { type: 'string', example: '2026-10-12', description: 'Fecha (YYYY-MM-DD) que debe ser lunes' },
          recetas: { type: 'array', items: { type: 'integer' }, minItems: 1, example: [1, 2] },
        },
      },
      Caja: {
        type: 'object',
        properties: {
          id_caja: { type: 'integer' }, id_usuario: { type: 'integer' }, semana: { type: 'string', example: '2026-10-12' },
          recetas: { type: 'array', items: { type: 'object', properties: { id_receta: { type: 'integer' }, nombre: { type: 'string' }, tipo_cocina: { type: 'string' }, dificultad: { type: 'string' }, tiempo_min: { type: 'integer' } } } },
        },
      },
      Resumen: {
        type: 'object',
        properties: {
          usuarios: { type: 'object', properties: { total: { type: 'integer' }, activos: { type: 'integer' } } },
          recetas: { type: 'object', properties: { total: { type: 'integer' } } },
          preparaciones_mes_actual: { type: 'integer' },
          suscripciones_activas_por_plan: { type: 'array', items: { type: 'object', properties: { plan: { type: 'string' }, total: { type: 'integer' } } } },
        },
      },
    },
  },
  paths: {},
};

const P = spec.paths;
const userId = idParam('id', 'Identificador del usuario');

// ---------- Auth ----------
P['/auth/registro'] = {
  post: op({
    tags: ['Auth'], resumen: 'Registrar un usuario (RF-01)', publico: true,
    descripcion: 'Crea la cuenta con rol `usuario` y le asigna el plan Gratuito. Valida correo único, confirmación de contraseña y aceptación de términos.',
    cuerpo: ref('RegistroInput'),
    ok: [201, 'Usuario creado', ref('Usuario')], errores: [400, 409],
  }),
};
P['/auth/login'] = {
  post: op({
    tags: ['Auth'], resumen: 'Iniciar sesión (RF-02)', publico: true,
    descripcion: 'Verifica las credenciales contra la base de datos y devuelve un token JWT. Ante credenciales erróneas responde siempre con el mismo mensaje.',
    cuerpo: ref('LoginInput'),
    ok: [200, 'Sesión iniciada', ref('LoginRespuesta')],
    errores: [400, 401, 403],
  }),
};

// ---------- Usuarios ----------
P['/usuarios'] = {
  get: op({
    tags: ['Usuarios'], resumen: 'Listar usuarios (admin, RF-19)',
    params: [query('q', 'Busca por nombre o correo'), query('estado', 'activo | inactivo'), query('rol', 'usuario | admin')],
    ok: [200, 'Lista de usuarios', arr('Usuario')], errores: [403],
  }),
};
P['/usuarios/{id}'] = {
  get: op({ tags: ['Usuarios'], resumen: 'Consultar un usuario (propio o admin)', params: [userId], ok: [200, 'Usuario', ref('Usuario')], errores: [400, 403, 404] }),
  put: op({
    tags: ['Usuarios'], resumen: 'Actualizar perfil (RF-14) o gestionar cuenta (admin)', params: [userId], cuerpo: ref('UsuarioUpdate'),
    ejemploCuerpo: { nombre: 'Ana María Gómez' }, ok: [200, 'Usuario actualizado', ref('Usuario')], errores: [400, 403, 404, 409],
  }),
  delete: op({ tags: ['Usuarios'], resumen: 'Eliminar un usuario (admin, RF-19)', params: [userId], ok: [204, 'Usuario eliminado'], errores: [400, 403, 404, 409] }),
};

// ---------- Recetas ----------
P['/recetas'] = {
  get: op({
    tags: ['Recetas'], resumen: 'Listar catálogo con búsqueda y filtros (RF-03, RF-04)',
    params: [
      query('q', 'Texto a buscar en nombre o descripción'), query('cocina', 'Nombre del tipo de cocina, p. ej. Italiana'),
      query('dificultad', 'facil | media | dificil'), query('pagina', 'Número de página (por defecto 1)', { type: 'integer' }),
      query('limite', 'Resultados por página (1-50, por defecto 10)', { type: 'integer' }),
    ],
    ok: [200, 'Página de recetas', ref('RecetasPagina')],
  }),
  post: op({
    tags: ['Recetas'], resumen: 'Registrar una receta (admin, RF-16)', cuerpo: ref('RecetaInput'),
    ok: [201, 'Receta creada', ref('Receta')], errores: [400, 403],
  }),
};
P['/recetas/{id}'] = {
  get: op({ tags: ['Recetas'], resumen: 'Detalle de una receta (RF-05)', params: [idParam('id', 'Identificador de la receta')], ok: [200, 'Receta', ref('Receta')], errores: [400, 404] }),
  put: op({
    tags: ['Recetas'], resumen: 'Actualizar una receta (admin, RF-17)', params: [idParam('id', 'Identificador de la receta')],
    cuerpo: { type: 'object', description: 'Al menos un campo de RecetaInput', allOf: [ref('RecetaInput')], required: [] },
    ejemploCuerpo: { tiempo_min: 35 }, ok: [200, 'Receta actualizada', ref('Receta')], errores: [400, 403, 404],
  }),
  delete: op({ tags: ['Recetas'], resumen: 'Eliminar una receta (admin, RF-17)', params: [idParam('id', 'Identificador de la receta')], ok: [204, 'Receta eliminada'], errores: [400, 403, 404] }),
};

// ---------- Reseñas ----------
P['/recetas/{id}/resenas'] = {
  get: op({ tags: ['Reseñas'], resumen: 'Consultar reseñas de una receta (RF-09)', params: [idParam('id', 'Identificador de la receta')], ok: [200, 'Reseñas y resumen', ref('ResenasReceta')], errores: [400, 404] }),
  post: op({
    tags: ['Reseñas'], resumen: 'Crear una reseña (RF-08)', descripcion: 'Un usuario solo puede reseñar una vez cada receta.',
    params: [idParam('id', 'Identificador de la receta')], cuerpo: ref('ResenaInput'), ok: [201, 'Reseña creada', ref('Resena')], errores: [400, 404, 409],
  }),
};
P['/resenas/{id}'] = {
  put: op({
    tags: ['Reseñas'], resumen: 'Editar una reseña propia', params: [idParam('id', 'Identificador de la reseña')],
    cuerpo: ref('ResenaInput'), ejemploCuerpo: { calificacion: 4 }, ok: [200, 'Reseña actualizada', ref('Resena')], errores: [400, 403, 404],
  }),
  delete: op({ tags: ['Reseñas'], resumen: 'Eliminar una reseña propia', params: [idParam('id', 'Identificador de la reseña')], ok: [204, 'Reseña eliminada'], errores: [400, 403, 404] }),
};

// ---------- Colección ----------
P['/usuarios/{id}/coleccion'] = {
  get: op({ tags: ['Colección'], resumen: 'Consultar la colección del usuario', params: [userId], ok: [200, 'Recetas guardadas', arr('RecetaColeccion')], errores: [400, 403, 404] }),
  post: op({
    tags: ['Colección'], resumen: 'Guardar una receta en la colección (RF-06)', params: [userId], cuerpo: ref('IdRecetaInput'),
    ok: [201, 'Receta guardada', ref('RecetaColeccion')], errores: [400, 403, 404, 409],
  }),
};
P['/usuarios/{id}/coleccion/{idReceta}'] = {
  delete: op({
    tags: ['Colección'], resumen: 'Quitar una receta de la colección', params: [userId, idParam('idReceta', 'Identificador de la receta')],
    ok: [204, 'Receta quitada'], errores: [400, 403, 404],
  }),
};

// ---------- Preparaciones y hábitos ----------
P['/usuarios/{id}/preparaciones'] = {
  get: op({ tags: ['Preparaciones y hábitos'], resumen: 'Listar recetas preparadas', params: [userId], ok: [200, 'Preparaciones', arr('Preparacion')], errores: [400, 403, 404] }),
  post: op({
    tags: ['Preparaciones y hábitos'], resumen: 'Marcar una receta como preparada (RF-07)',
    descripcion: 'Regla de negocio: el plan Gratuito tiene un límite mensual de recetas (5). Al superarlo responde 403.',
    params: [userId], cuerpo: ref('IdRecetaInput'), ok: [201, 'Preparación registrada', ref('Preparacion')], errores: [400, 403, 404],
  }),
};
P['/usuarios/{id}/habitos'] = {
  get: op({
    tags: ['Preparaciones y hábitos'], resumen: 'Consultar hábitos de cocina (RF-10)',
    descripcion: 'Endpoint compuesto: calcula indicadores a partir de las preparaciones (no hay tabla de hábitos).',
    params: [userId], ok: [200, 'Indicadores de hábitos', ref('Habitos')], errores: [400, 403, 404],
  }),
};

// ---------- Suscripciones ----------
P['/usuarios/{id}/suscripcion'] = {
  get: op({ tags: ['Suscripciones'], resumen: 'Consultar plan y uso (RF-11)', params: [userId], ok: [200, 'Suscripción vigente', ref('SuscripcionUsuario')], errores: [400, 403, 404] }),
  put: op({
    tags: ['Suscripciones'], resumen: 'Cambiar de plan, p. ej. a Premium (RF-12)', params: [userId], cuerpo: ref('CambioPlanInput'),
    descripcion: 'Cancela la suscripción activa y crea una nueva. Premium vence al mes.',
    ok: [200, 'Nueva suscripción', ref('SuscripcionUsuario')], errores: [400, 403, 404, 409],
  }),
};
P['/suscripciones'] = {
  get: op({
    tags: ['Suscripciones'], resumen: 'Listar suscripciones (admin, RF-18)',
    params: [query('estado', 'activa | vencida | cancelada'), query('q', 'Busca por nombre o correo del usuario')],
    ok: [200, 'Suscripciones', arr('SuscripcionAdmin')], errores: [403],
  }),
};

// ---------- Caja semanal ----------
P['/usuarios/{id}/caja-semanal'] = {
  get: op({
    tags: ['Caja semanal'], resumen: 'Consultar la caja de una semana (RF-13)',
    params: [userId, query('semana', 'Lunes de la semana (YYYY-MM-DD). Por defecto, la semana actual')],
    ok: [200, 'Caja semanal', ref('Caja')], errores: [400, 403, 404],
  }),
  post: op({
    tags: ['Caja semanal'], resumen: 'Asignar una caja semanal (admin, RF-13)', params: [userId], cuerpo: ref('CajaInput'),
    descripcion: 'Solo para usuarios Premium. La semana debe iniciar en lunes.', ok: [201, 'Caja creada', ref('Caja')], errores: [400, 403, 404, 409],
  }),
};
P['/usuarios/{id}/caja-semanal/{idCaja}'] = {
  delete: op({
    tags: ['Caja semanal'], resumen: 'Eliminar una caja semanal (admin)', params: [userId, idParam('idCaja', 'Identificador de la caja')],
    ok: [204, 'Caja eliminada'], errores: [400, 403, 404],
  }),
};

// ---------- Catálogos ----------
const catalogo = (ruta, nombre, tag, schema, idNombre) => {
  P[ruta] = {
    get: op({ tags: ['Catálogos'], resumen: `Listar ${nombre}`, publico: true, ok: [200, 'Lista', arr(schema)] }),
    post: op({ tags: ['Catálogos'], resumen: `Crear ${tag} (admin)`, cuerpo: ref('NombreInput'), ok: [201, 'Creado', ref(schema)], errores: [400, 403, 409] }),
  };
  P[`${ruta}/{id}`] = {
    put: op({ tags: ['Catálogos'], resumen: `Renombrar ${tag} (admin)`, params: [idParam('id', idNombre)], cuerpo: ref('NombreInput'), ok: [200, 'Actualizado', ref(schema)], errores: [400, 403, 404, 409] }),
    delete: op({ tags: ['Catálogos'], resumen: `Eliminar ${tag} (admin)`, params: [idParam('id', idNombre)], ok: [204, 'Eliminado'], errores: [400, 403, 404, 409] }),
  };
};
catalogo('/tipos-cocina', 'tipos de cocina', 'un tipo de cocina', 'TipoCocina', 'Identificador del tipo de cocina');
catalogo('/etiquetas', 'etiquetas de reseñas', 'una etiqueta', 'Etiqueta', 'Identificador de la etiqueta');
P['/planes'] = { get: op({ tags: ['Catálogos'], resumen: 'Listar planes de suscripción', publico: true, ok: [200, 'Planes', arr('Plan')] }) };

// ---------- Administración ----------
P['/admin/resumen'] = {
  get: op({ tags: ['Administración'], resumen: 'Panel de resumen (admin, RF-15)', ok: [200, 'Resumen general', ref('Resumen')], errores: [403] }),
};

module.exports = spec;
