const express = require('express');
const { sincronizarCfdis, obtenerEstado } = require('../services/cfdiSync.service');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { validateQuery } = require('../middlewares/validate');
const validateSchema = require('../middlewares/validateSchema');
const { syncEjecutarSchema, syncEstadoSchema } = require('../schemas/sync.schema');
const { ROLE_GROUPS } = require('../config/roles');
const logger = require('../config/logger').default;
const router = express.Router();

router.post('/ejecutar',
  authenticateToken,
  requireRole(...ROLE_GROUPS.FINANZAS_WRITE),
  validateSchema,
  validateQuery(syncEjecutarSchema),
  async (req, res) => {
    const { schema, tipo } = req.validatedQuery;

    try {
      const resultado = await sincronizarCfdis(schema, tipo);
      res.json({ ...resultado, schema, tipo });
    } catch (err) {
      logger.error({ err }, 'Error en sincronización');
      res.status(500).json({ error: err.message });
    }
  }
);

router.get('/estado',
  authenticateToken,
  requireRole(...ROLE_GROUPS.FINANZAS_READ),
  validateSchema,
  validateQuery(syncEstadoSchema),
  async (req, res) => {
    const { schema } = req.validatedQuery;

    try {
      const estado = await obtenerEstado(schema);
      res.json(estado);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

module.exports = router;
