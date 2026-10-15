// Exporta la especificacion OpenAPI a docs/openapi.json (util para Swagger Editor, Postman o publicar en GitHub Pages)
const fs = require('fs');
const path = require('path');
const spec = require('../src/docs/openapi');

const destino = path.join(__dirname, '..', 'docs');
fs.mkdirSync(destino, { recursive: true });
fs.writeFileSync(path.join(destino, 'openapi.json'), JSON.stringify(spec, null, 2));
console.log('Especificación exportada en docs/openapi.json');
