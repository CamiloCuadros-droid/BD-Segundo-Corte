# TasteBox API (corte 2)

API REST de TasteBox hecha con **Node.js + Express + MySQL**, organizada por capas
(`routes → middlewares/validators → controllers → services → repositories → MySQL`).
Documentación interactiva con **Swagger UI** (OpenAPI 3.0).

## Requisitos
- Node.js 18 o superior
- MySQL 8 (o MariaDB 10.5+)

## Puesta en marcha
```bash
npm install
cp .env.example .env        # en Windows: copy .env.example .env  (ajusta DB_USER y DB_PASSWORD)
npm run db:init             # crea la BD "tastebox" y carga datos iniciales
npm start                   # http://localhost:5000
```
- Swagger UI: http://localhost:5000/api-docs
- Especificación: http://localhost:5000/openapi.json (también en `docs/openapi.json` con `npm run docs:export`)
- Administrador de prueba: `admin@tastebox.com` / `admin123`
- Plan Gratuito: 5 recetas preparadas al mes. Plan Premium: id 2.

## Cómo usar la API
1. `POST /auth/login` → copia el `token`.
2. En Swagger UI pulsa **Authorize** y pega el token (en Postman/Thunder: `Authorization: Bearer <token>`).

## Pruebas
La colección `postman/TasteBox.postman_collection.json` tiene 99 solicitudes (un caso de éxito ✅ y uno de error ❌ por endpoint, 248 aserciones).
- **Postman:** Import → colección → Runner → ejecutar en orden.
- **Thunder Client:** Collections → ⋮ → Import → selecciona el mismo archivo.
- **Terminal:** `npx newman run postman/TasteBox.postman_collection.json`

Puede ejecutarse varias veces seguidas: la carpeta 11 elimina lo que la colección crea.
Para regenerarla: `npm run postman:generar`.

## Estructura
```
database/schema.sql    esquema + datos iniciales
src/routes             rutas (URI + verbo)
src/middlewares        autenticación JWT, roles, errores
src/validators         validación de entrada
src/controllers        HTTP (req/res)
src/services           reglas de negocio y transacciones
src/repositories       SQL
src/docs/openapi.js    documentación OpenAPI
informe/               figuras y secciones LaTeX del informe
```

## Notas
- Las contraseñas se guardan en **texto plano** solo en este corte (así lo pide la entrega). Corte siguiente: bcrypt/Argon2id.
- Para publicar el enlace de Swagger necesitas desplegar la API (p. ej. Render + una BD MySQL en la nube) o publicar `docs/openapi.json` en Swagger Editor / GitHub Pages.
