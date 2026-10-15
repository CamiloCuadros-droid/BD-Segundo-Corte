const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');
const catalogos = require('./routes/catalogos.routes');
const { noEncontrado, manejarErrores } = require('./middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Documentacion interactiva (Swagger UI) y especificacion OpenAPI en JSON
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapi, { customSiteTitle: 'TasteBox API' }));
app.get('/openapi.json', (req, res) => res.json(openapi));

app.get('/', (req, res) => res.json({ api: 'TasteBox', version: '2.0.0', documentacion: '/api-docs' }));

// Rutas -> controladores -> servicios -> repositorios -> MySQL
app.use('/auth', require('./routes/auth.routes'));
app.use('/usuarios', require('./routes/usuarios.routes'));
app.use('/recetas', require('./routes/recetas.routes'));
app.use('/resenas', require('./routes/resenas.routes'));
app.use('/tipos-cocina', catalogos.tiposCocina);
app.use('/etiquetas', catalogos.etiquetas);
app.use('/planes', catalogos.planes);
app.use('/', require('./routes/admin.routes'));

app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
