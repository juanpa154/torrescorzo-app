const express = require('express');
const { clasificarCfdisSinCategoria } = require('../jobs/clasificarMasivo');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { validateQuery } = require('../middlewares/validate');
const validateSchema = require('../middlewares/validateSchema');
const { clasificarQuerySchema } = require('../schemas/cfdi.schema');
const { ROLE_GROUPS } = require('../config/roles');
const logger = require('../config/logger').default;
const router = express.Router();

router.get('/clasificar',
  authenticateToken,
  requireRole(...ROLE_GROUPS.FINANZAS_WRITE),
  validateSchema,
  validateQuery(clasificarQuerySchema),
  async (req, res) => {
    const { schema, tipo, limit } = req.validatedQuery;

    try {
      const resultado = await clasificarCfdisSinCategoria(schema, limit, tipo);
      res.json({ ...resultado, schema, tipo, limite: limit });
    } catch (err) {
      logger.error({ err }, '[Clasificar] Error');
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
