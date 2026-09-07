const express = require('express');
const router = express.Router();
const { getCfdiIngresos, getCfdiRecibidos } = require('../controllers/cfdi.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { validateQuery } = require('../middlewares/validate');
const validateSchema = require('../middlewares/validateSchema');
const { cfdiQuerySchema } = require('../schemas/cfdi.schema');
const { ROLE_GROUPS } = require('../config/roles');
const logger = require('../config/logger').default;

router.get('/:schema/ingresos',
  authenticateToken,
  requireRole(...ROLE_GROUPS.FINANZAS_READ),
  validateSchema,
  validateQuery(cfdiQuerySchema),
  async (req, res) => {
    const { schema } = req.params;
    const { page, limit, mes, anio, tipo, rfc, minMonto, maxMonto, categoriaIa } = req.validatedQuery;

    try {
      const result = await getCfdiIngresos(schema, page, limit, {
        mes, anio, tipo, rfc, minMonto, maxMonto, categoriaIa
      });
      res.json(result);
    } catch (error) {
      logger.error({ err: error }, 'Error al obtener ingresos');
      res.status(500).json({ message: 'Error al obtener los CFDI de ingresos' });
    }
  }
);

router.get('/:schema/recibidos',
  authenticateToken,
  requireRole(...ROLE_GROUPS.FINANZAS_READ),
  validateSchema,
  validateQuery(cfdiQuerySchema),
  async (req, res) => {
    const { schema } = req.params;
    const { page, limit, mes, anio, tipo, rfc, minMonto, maxMonto, categoriaIa } = req.validatedQuery;

    try {
      const result = await getCfdiRecibidos(schema, page, limit, {
        mes, anio, tipo, rfc, minMonto, maxMonto, categoriaIa
      });
      res.json(result);
    } catch (error) {
      logger.error({ err: error }, 'Error al obtener recibidos');
      res.status(500).json({ message: 'Error al obtener los CFDI de recibidos' });
    }
  }
);

module.exports = router;
