// Gate para todo endpoint CFDI que interpola `schema` en SQL crudo
// (cfdiSync.service.js, cfdiDashboard.controller.js, db/cfdiClient.js) —
// sin esto, cualquier valor de schema pasa directo al query/search_path.
const allowedSchemas = require('../../config/schemas');

function validateSchema(req, res, next) {
  const schema = req.params.schema || req.query.schema || req.body.schema;

  if (!schema || !allowedSchemas.includes(schema)) {
    return res.status(400).json({
      error: `Esquema no válido o faltante. Esquemas permitidos: ${allowedSchemas.join(', ')}`
    });
  }

  next();
}

module.exports = validateSchema;
