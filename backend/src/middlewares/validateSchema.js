// backend/middlewares/validateSchema.js
const allowedSchemas = require('../config/schemas');

function validateSchema(req, res, next) {
  const schema = req.query.schema || req.body.schema;

  if (!schema || !allowedSchemas.includes(schema)) {
    return res.status(400).json({
      error: `Esquema no válido o faltante. Esquemas permitidos: ${allowedSchemas.join(', ')}`
    });
  }

  req.schema = schema; // Se puede usar después en el controlador
  next();
}

module.exports = validateSchema;
