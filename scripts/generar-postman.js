// Genera postman/TasteBox.postman_collection.json (importable en Postman, Thunder Client e Insomnia)
// Cada endpoint tiene al menos un caso de exito (✅) y uno de error (❌), en orden de ejecucion.
const fs = require('fs');
const path = require('path');

const TOKENS = { admin: '{{adminToken}}', user: '{{userToken}}', userB: '{{userBToken}}' };

const req = ({ n, m, url, auth, body, code, pre, post }) => {
  const header = [];
  if (body !== undefined) header.push({ key: 'Content-Type', value: 'application/json' });
  if (auth && auth !== 'none') header.push({ key: 'Authorization', value: `Bearer ${TOKENS[auth]}` });

  const test = [`pm.test('Código de respuesta ${code}', () => pm.response.to.have.status(${code}));`];
  if (code !== 204) test.push("pm.test('Responde JSON', () => pm.response.to.be.json);");
  if (code >= 400) test.push("pm.test('Incluye mensaje de error', () => pm.expect(pm.response.json()).to.have.property('error'));");
  if (post) test.push(post);

  const [rutaBase, consulta] = url.split('?');
  return {
    name: n,
    event: [
      ...(pre ? [{ listen: 'prerequest', script: { type: 'text/javascript', exec: [pre] } }] : []),
      { listen: 'test', script: { type: 'text/javascript', exec: test } },
    ],
    request: {
      method: m,
      header,
      ...(body !== undefined ? { body: { mode: 'raw', raw: typeof body === 'string' ? body : JSON.stringify(body, null, 2), options: { raw: { language: 'json' } } } } : {}),
      url: {
        raw: `{{baseUrl}}${url}`,
        host: ['{{baseUrl}}'],
        path: rutaBase.split('/').filter(Boolean),
        ...(consulta ? { query: consulta.split('&').map((p) => { const [key, value] = p.split('='); return { key, value }; }) } : {}),
      },
    },
  };
};
const ok = (n, o) => req({ ...o, n: `✅ ${n}` });
const err = (n, o) => req({ ...o, n: `❌ ${n}` });
const setVar = (nombre, campo) => `pm.collectionVariables.set('${nombre}', pm.response.json().${campo});`;

const carpetas = [];
const carpeta = (name, item) => carpetas.push({ name, item });

carpeta('1. Auth', [
  ok('Registrar usuario A', { m: 'POST', url: '/auth/registro', auth: 'none', code: 201,
    pre: "pm.collectionVariables.set('userEmail', 'ana' + Date.now() + '@correo.com');",
    body: '{\n  "nombre": "Ana Gómez",\n  "correo": "{{userEmail}}",\n  "contrasena": "secreto123",\n  "confirmar_contrasena": "secreto123",\n  "acepta_terminos": true\n}',
    post: setVar('userId', 'id_usuario') }),
  err('Registro con datos inválidos (correo mal formado, faltan campos)', { m: 'POST', url: '/auth/registro', auth: 'none', code: 400,
    body: { nombre: 'X', correo: 'no-es-un-correo' } }),
  err('Registro con contraseñas que no coinciden', { m: 'POST', url: '/auth/registro', auth: 'none', code: 400,
    body: { nombre: 'Ana', correo: 'otra@correo.com', contrasena: 'secreto123', confirmar_contrasena: 'distinta', acepta_terminos: true } }),
  err('Registro con correo ya existente', { m: 'POST', url: '/auth/registro', auth: 'none', code: 409,
    body: '{\n  "nombre": "Ana Repetida",\n  "correo": "{{userEmail}}",\n  "contrasena": "secreto123",\n  "confirmar_contrasena": "secreto123",\n  "acepta_terminos": true\n}' }),
  ok('Registrar usuario B (se usa para probar permisos y eliminación)', { m: 'POST', url: '/auth/registro', auth: 'none', code: 201,
    pre: "pm.collectionVariables.set('userBEmail', 'luis' + Date.now() + '@correo.com');",
    body: '{\n  "nombre": "Luis Pérez",\n  "correo": "{{userBEmail}}",\n  "contrasena": "clave456",\n  "confirmar_contrasena": "clave456",\n  "acepta_terminos": true\n}',
    post: setVar('userBId', 'id_usuario') }),
  ok('Login administrador', { m: 'POST', url: '/auth/login', auth: 'none', code: 200,
    body: { correo: 'admin@tastebox.com', contrasena: 'admin123' }, post: setVar('adminToken', 'token') }),
  ok('Login usuario A', { m: 'POST', url: '/auth/login', auth: 'none', code: 200,
    body: '{\n  "correo": "{{userEmail}}",\n  "contrasena": "secreto123"\n}', post: setVar('userToken', 'token') }),
  ok('Login usuario B', { m: 'POST', url: '/auth/login', auth: 'none', code: 200,
    body: '{\n  "correo": "{{userBEmail}}",\n  "contrasena": "clave456"\n}', post: setVar('userBToken', 'token') }),
  err('Login con contraseña incorrecta', { m: 'POST', url: '/auth/login', auth: 'none', code: 401,
    body: { correo: 'admin@tastebox.com', contrasena: 'incorrecta' } }),
  err('Login sin enviar campos', { m: 'POST', url: '/auth/login', auth: 'none', code: 400, body: {} }),
]);

carpeta('2. Catálogos (tipos de cocina, etiquetas, planes)', [
  ok('Listar planes', { m: 'GET', url: '/planes', auth: 'none', code: 200 }),
  ok('Listar tipos de cocina', { m: 'GET', url: '/tipos-cocina', auth: 'none', code: 200 }),
  ok('Crear tipo de cocina (admin)', { m: 'POST', url: '/tipos-cocina', auth: 'admin', code: 201,
    body: { nombre: 'Fusión {{$timestamp}}' }, post: setVar('cocinaId', 'id_tipo_cocina') }),
  err('Crear tipo de cocina siendo usuario normal', { m: 'POST', url: '/tipos-cocina', auth: 'user', code: 403, body: { nombre: 'Peruana' } }),
  err('Crear tipo de cocina con nombre vacío', { m: 'POST', url: '/tipos-cocina', auth: 'admin', code: 400, body: { nombre: '' } }),
  ok('Renombrar tipo de cocina', { m: 'PUT', url: '/tipos-cocina/{{cocinaId}}', auth: 'admin', code: 200, body: { nombre: 'Fusión renovada {{$timestamp}}' } }),
  err('Renombrar tipo de cocina inexistente', { m: 'PUT', url: '/tipos-cocina/999999', auth: 'admin', code: 404, body: { nombre: 'Nada' } }),
  ok('Listar etiquetas', { m: 'GET', url: '/etiquetas', auth: 'none', code: 200 }),
  ok('Crear etiqueta (admin)', { m: 'POST', url: '/etiquetas', auth: 'admin', code: 201,
    body: { nombre: 'Etiqueta {{$timestamp}}' }, post: setVar('etiquetaId', 'id_etiqueta') }),
  err('Crear etiqueta repetida', { m: 'POST', url: '/etiquetas', auth: 'admin', code: 409, body: { nombre: 'Rápida' } }),
  ok('Renombrar etiqueta', { m: 'PUT', url: '/etiquetas/{{etiquetaId}}', auth: 'admin', code: 200, body: { nombre: 'Etiqueta editada {{$timestamp}}' } }),
  err('Renombrar etiqueta con id no numérico', { m: 'PUT', url: '/etiquetas/abc', auth: 'admin', code: 400, body: { nombre: 'X1' } }),
]);

carpeta('3. Recetas', [
  ok('Crear receta (admin)', { m: 'POST', url: '/recetas', auth: 'admin', code: 201,
    body: '{\n  "nombre": "Arepas rellenas",\n  "id_tipo_cocina": {{cocinaId}},\n  "dificultad": "facil",\n  "tiempo_min": 25,\n  "descripcion": "Arepas de maíz rellenas de queso y pollo desmechado.",\n  "imagen_url": "https://ejemplo.com/arepas.jpg"\n}',
    post: setVar('recetaId', 'id_receta') }),
  err('Crear receta con campos faltantes o inválidos', { m: 'POST', url: '/recetas', auth: 'admin', code: 400, body: { nombre: 'A', tiempo_min: -5 } }),
  err('Crear receta con tipo de cocina inexistente', { m: 'POST', url: '/recetas', auth: 'admin', code: 400,
    body: { nombre: 'Sopa rara', id_tipo_cocina: 99999, dificultad: 'media', tiempo_min: 20, descripcion: 'Una sopa que no debería crearse.' } }),
  err('Crear receta siendo usuario normal', { m: 'POST', url: '/recetas', auth: 'user', code: 403,
    body: { nombre: 'Sopa', id_tipo_cocina: 1, dificultad: 'media', tiempo_min: 20, descripcion: 'Descripción suficientemente larga.' } }),
  ok('Listar catálogo', { m: 'GET', url: '/recetas', auth: 'user', code: 200 }),
  ok('Buscar y filtrar (q, cocina, dificultad, paginación)', { m: 'GET', url: '/recetas?q=Pasta&cocina=Italiana&dificultad=media&pagina=1&limite=5', auth: 'user', code: 200 }),
  err('Listar catálogo sin token', { m: 'GET', url: '/recetas', auth: 'none', code: 401 }),
  ok('Detalle de receta', { m: 'GET', url: '/recetas/{{recetaId}}', auth: 'user', code: 200 }),
  err('Detalle de receta inexistente', { m: 'GET', url: '/recetas/999999', auth: 'user', code: 404 }),
  ok('Actualizar receta (admin)', { m: 'PUT', url: '/recetas/{{recetaId}}', auth: 'admin', code: 200, body: { tiempo_min: 35 } }),
  err('Actualizar receta con dificultad inválida', { m: 'PUT', url: '/recetas/{{recetaId}}', auth: 'admin', code: 400, body: { dificultad: 'imposible' } }),
  err('Actualizar receta inexistente', { m: 'PUT', url: '/recetas/999999', auth: 'admin', code: 404, body: { tiempo_min: 10 } }),
]);

carpeta('4. Reseñas', [
  ok('Crear reseña (usuario A)', { m: 'POST', url: '/recetas/{{recetaId}}/resenas', auth: 'user', code: 201,
    body: { calificacion: 5, comentario: 'Quedó deliciosa', volveria_a_cocinar: true, etiquetas: [1, 3] },
    post: setVar('resenaId', 'id_resena') }),
  err('Crear segunda reseña de la misma receta', { m: 'POST', url: '/recetas/{{recetaId}}/resenas', auth: 'user', code: 409, body: { calificacion: 3 } }),
  err('Crear reseña con calificación fuera de rango', { m: 'POST', url: '/recetas/{{recetaId}}/resenas', auth: 'userB', code: 400, body: { calificacion: 9 } }),
  err('Crear reseña de receta inexistente', { m: 'POST', url: '/recetas/999999/resenas', auth: 'user', code: 404, body: { calificacion: 4 } }),
  ok('Consultar reseñas de la receta', { m: 'GET', url: '/recetas/{{recetaId}}/resenas', auth: 'user', code: 200 }),
  ok('Editar reseña propia', { m: 'PUT', url: '/resenas/{{resenaId}}', auth: 'user', code: 200, body: { calificacion: 4, comentario: 'Muy buena, la repetiría' } }),
  err('Editar reseña de otro usuario', { m: 'PUT', url: '/resenas/{{resenaId}}', auth: 'userB', code: 403, body: { calificacion: 1 } }),
  err('Editar reseña inexistente', { m: 'PUT', url: '/resenas/999999', auth: 'user', code: 404, body: { calificacion: 2 } }),
  ok('Eliminar reseña propia', { m: 'DELETE', url: '/resenas/{{resenaId}}', auth: 'user', code: 204 }),
  err('Eliminar reseña ya eliminada', { m: 'DELETE', url: '/resenas/{{resenaId}}', auth: 'user', code: 404 }),
]);

carpeta('5. Colección personal', [
  ok('Guardar receta en la colección', { m: 'POST', url: '/usuarios/{{userId}}/coleccion', auth: 'user', code: 201, body: '{ "id_receta": {{recetaId}} }' }),
  err('Guardar la misma receta otra vez', { m: 'POST', url: '/usuarios/{{userId}}/coleccion', auth: 'user', code: 409, body: '{ "id_receta": {{recetaId}} }' }),
  err('Guardar sin indicar id_receta', { m: 'POST', url: '/usuarios/{{userId}}/coleccion', auth: 'user', code: 400, body: {} }),
  err('Guardar receta inexistente', { m: 'POST', url: '/usuarios/{{userId}}/coleccion', auth: 'user', code: 404, body: { id_receta: 999999 } }),
  ok('Consultar mi colección', { m: 'GET', url: '/usuarios/{{userId}}/coleccion', auth: 'user', code: 200 }),
  err('Consultar la colección de otro usuario', { m: 'GET', url: '/usuarios/1/coleccion', auth: 'user', code: 403 }),
  ok('Quitar receta de la colección', { m: 'DELETE', url: '/usuarios/{{userId}}/coleccion/{{recetaId}}', auth: 'user', code: 204 }),
  err('Quitar una receta que no está guardada', { m: 'DELETE', url: '/usuarios/{{userId}}/coleccion/{{recetaId}}', auth: 'user', code: 404 }),
]);

carpeta('6. Preparaciones y hábitos', [
  ok('Marcar receta como preparada', { m: 'POST', url: '/usuarios/{{userId}}/preparaciones', auth: 'user', code: 201, body: '{ "id_receta": {{recetaId}} }' }),
  err('Marcar una receta inexistente como preparada', { m: 'POST', url: '/usuarios/{{userId}}/preparaciones', auth: 'user', code: 404, body: { id_receta: 999999 } }),
  err('Marcar preparada con id_receta inválido', { m: 'POST', url: '/usuarios/{{userId}}/preparaciones', auth: 'user', code: 400, body: { id_receta: 'abc' } }),
  ok('Listar mis preparaciones', { m: 'GET', url: '/usuarios/{{userId}}/preparaciones', auth: 'user', code: 200 }),
  ok('Consultar mis hábitos de cocina', { m: 'GET', url: '/usuarios/{{userId}}/habitos', auth: 'user', code: 200,
    post: "pm.test('Incluye racha y distribución', () => { const j = pm.response.json(); pm.expect(j).to.have.property('racha_dias'); pm.expect(j).to.have.property('distribucion_por_cocina'); });" }),
  err('Consultar hábitos de otro usuario', { m: 'GET', url: '/usuarios/1/habitos', auth: 'user', code: 403 }),
]);

carpeta('7. Suscripciones', [
  ok('Consultar mi suscripción y uso del plan', { m: 'GET', url: '/usuarios/{{userId}}/suscripcion', auth: 'user', code: 200 }),
  ok('Cambiar a Premium', { m: 'PUT', url: '/usuarios/{{userId}}/suscripcion', auth: 'user', code: 200, body: { id_plan: 2 } }),
  err('Cambiar a un plan que ya tengo', { m: 'PUT', url: '/usuarios/{{userId}}/suscripcion', auth: 'user', code: 409, body: { id_plan: 2 } }),
  err('Cambiar de plan con id_plan inválido', { m: 'PUT', url: '/usuarios/{{userId}}/suscripcion', auth: 'user', code: 400, body: { id_plan: 'dos' } }),
  err('Cambiar a un plan inexistente', { m: 'PUT', url: '/usuarios/{{userId}}/suscripcion', auth: 'user', code: 404, body: { id_plan: 999 } }),
  ok('Listar suscripciones (admin)', { m: 'GET', url: '/suscripciones?estado=activa', auth: 'admin', code: 200 }),
  err('Listar suscripciones siendo usuario normal', { m: 'GET', url: '/suscripciones', auth: 'user', code: 403 }),
]);

carpeta('8. Caja semanal (Premium)', [
  err('Consultar caja de una semana sin caja asignada', { m: 'GET', url: '/usuarios/{{userId}}/caja-semanal?semana=2026-10-12', auth: 'user', code: 404 }),
  ok('Asignar caja semanal (admin)', { m: 'POST', url: '/usuarios/{{userId}}/caja-semanal', auth: 'admin', code: 201,
    body: '{ "semana": "2026-10-12", "recetas": [{{recetaId}}] }', post: setVar('cajaId', 'id_caja') }),
  err('Asignar caja con una semana que no inicia en lunes', { m: 'POST', url: '/usuarios/{{userId}}/caja-semanal', auth: 'admin', code: 400,
    body: '{ "semana": "2026-10-13", "recetas": [{{recetaId}}] }' }),
  err('Asignar caja duplicada para la misma semana', { m: 'POST', url: '/usuarios/{{userId}}/caja-semanal', auth: 'admin', code: 409,
    body: '{ "semana": "2026-10-12", "recetas": [{{recetaId}}] }' }),
  err('Asignar caja siendo usuario normal', { m: 'POST', url: '/usuarios/{{userId}}/caja-semanal', auth: 'user', code: 403,
    body: '{ "semana": "2026-10-19", "recetas": [{{recetaId}}] }' }),
  err('Asignar caja a un usuario del plan gratuito', { m: 'POST', url: '/usuarios/{{userBId}}/caja-semanal', auth: 'admin', code: 403,
    body: '{ "semana": "2026-10-12", "recetas": [{{recetaId}}] }' }),
  ok('Consultar mi caja de la semana', { m: 'GET', url: '/usuarios/{{userId}}/caja-semanal?semana=2026-10-12', auth: 'user', code: 200 }),
  err('Consultar caja con fecha que no es lunes', { m: 'GET', url: '/usuarios/{{userId}}/caja-semanal?semana=2026-10-13', auth: 'user', code: 400 }),
  ok('Eliminar caja semanal (admin)', { m: 'DELETE', url: '/usuarios/{{userId}}/caja-semanal/{{cajaId}}', auth: 'admin', code: 204 }),
  err('Eliminar una caja inexistente', { m: 'DELETE', url: '/usuarios/{{userId}}/caja-semanal/{{cajaId}}', auth: 'admin', code: 404 }),
]);

carpeta('9. Usuarios y perfil', [
  ok('Listar usuarios (admin)', { m: 'GET', url: '/usuarios', auth: 'admin', code: 200 }),
  ok('Buscar usuarios por nombre o correo', { m: 'GET', url: '/usuarios?q=ana&estado=activo', auth: 'admin', code: 200 }),
  err('Listar usuarios siendo usuario normal', { m: 'GET', url: '/usuarios', auth: 'user', code: 403 }),
  ok('Consultar mi perfil', { m: 'GET', url: '/usuarios/{{userId}}', auth: 'user', code: 200 }),
  err('Consultar un usuario inexistente', { m: 'GET', url: '/usuarios/999999', auth: 'admin', code: 404 }),
  ok('Actualizar mi perfil', { m: 'PUT', url: '/usuarios/{{userId}}', auth: 'user', code: 200, body: { nombre: 'Ana María Gómez' } }),
  err('Actualizar perfil con correo inválido', { m: 'PUT', url: '/usuarios/{{userId}}', auth: 'user', code: 400, body: { correo: 'no-valido' } }),
  err('Intentar cambiarme el rol a admin', { m: 'PUT', url: '/usuarios/{{userId}}', auth: 'user', code: 403, body: { rol: 'admin' } }),
  err('Actualizar perfil con un correo ya usado', { m: 'PUT', url: '/usuarios/{{userId}}', auth: 'user', code: 409, body: { correo: 'admin@tastebox.com' } }),
  ok('Desactivar una cuenta (admin)', { m: 'PUT', url: '/usuarios/{{userBId}}', auth: 'admin', code: 200, body: { estado: 'inactivo' } }),
  ok('Eliminar un usuario (admin)', { m: 'DELETE', url: '/usuarios/{{userBId}}', auth: 'admin', code: 204 }),
  err('Eliminar un usuario siendo usuario normal', { m: 'DELETE', url: '/usuarios/{{userId}}', auth: 'user', code: 403 }),
  err('Eliminar mi propia cuenta de administrador', { m: 'DELETE', url: '/usuarios/1', auth: 'admin', code: 409 }),
  err('Eliminar un usuario que ya no existe', { m: 'DELETE', url: '/usuarios/{{userBId}}', auth: 'admin', code: 404 }),
]);

carpeta('10. Administración', [
  ok('Panel de resumen (admin)', { m: 'GET', url: '/admin/resumen', auth: 'admin', code: 200 }),
  err('Panel de resumen siendo usuario normal', { m: 'GET', url: '/admin/resumen', auth: 'user', code: 403 }),
  err('Panel de resumen sin sesión', { m: 'GET', url: '/admin/resumen', auth: 'none', code: 401 }),
]);

carpeta('11. Limpieza (eliminaciones)', [
  err('Eliminar receta siendo usuario normal', { m: 'DELETE', url: '/recetas/{{recetaId}}', auth: 'user', code: 403 }),
  ok('Eliminar receta (admin)', { m: 'DELETE', url: '/recetas/{{recetaId}}', auth: 'admin', code: 204 }),
  err('Eliminar receta ya eliminada', { m: 'DELETE', url: '/recetas/{{recetaId}}', auth: 'admin', code: 404 }),
  ok('Eliminar tipo de cocina creado', { m: 'DELETE', url: '/tipos-cocina/{{cocinaId}}', auth: 'admin', code: 204 }),
  err('Eliminar tipo de cocina en uso por recetas', { m: 'DELETE', url: '/tipos-cocina/1', auth: 'admin', code: 409 }),
  ok('Eliminar etiqueta creada', { m: 'DELETE', url: '/etiquetas/{{etiquetaId}}', auth: 'admin', code: 204 }),
  err('Eliminar etiqueta inexistente', { m: 'DELETE', url: '/etiquetas/999999', auth: 'admin', code: 404 }),
]);

const coleccion = {
  info: {
    name: 'TasteBox API - Corte 2',
    description: 'Colección de pruebas: cada endpoint tiene un caso de éxito (✅) y uno de error (❌). Ejecutar en orden (Collection Runner) con la API en http://localhost:5000 y la BD recién inicializada.',
    schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
  },
  variable: ['baseUrl:http://localhost:5000', 'adminToken:', 'userToken:', 'userBToken:', 'userId:', 'userBId:', 'userEmail:', 'userBEmail:', 'recetaId:', 'cocinaId:', 'etiquetaId:', 'resenaId:', 'cajaId:']
    .map((v) => { const i = v.indexOf(':'); return { key: v.slice(0, i), value: v.slice(i + 1) }; }),
  item: carpetas,
};

const salida = path.join(__dirname, '..', 'postman', 'TasteBox.postman_collection.json');
fs.writeFileSync(salida, JSON.stringify(coleccion, null, 2));
const total = carpetas.reduce((a, c) => a + c.item.length, 0);
console.log(`Colección generada: ${total} solicitudes -> ${salida}`);
