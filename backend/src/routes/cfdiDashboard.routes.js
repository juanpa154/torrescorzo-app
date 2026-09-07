const express = require('express');
const { getDashboard } = require('../controllers/cfdiDashboard.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { validateQuery } = require('../middlewares/validate');
const validateSchema = require('../middlewares/validateSchema');
const { dashboardQuerySchema } = require('../schemas/cfdi.schema');
const { ROLE_GROUPS } = require('../config/roles');
const logger = require('../config/logger').default;
const router = express.Router();

router.get('/',
  authenticateToken,
  requireRole(...ROLE_GROUPS.FINANZAS_READ),
  validateSchema,
  validateQuery(dashboardQuerySchema),
  async (req, res) => {
    const { schema, anio } = req.validatedQuery;

    try {
      const data = await getDashboard(schema, anio);
      res.json(data);
    } catch (err) {
      logger.error({ err }, '[Dashboard] Error');
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
