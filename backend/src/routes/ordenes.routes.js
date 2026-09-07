const express = require('express');
const router = express.Router();
const { getOrdenes } = require('../db');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { ROLE_GROUPS } = require('../config/roles');

router.get('/', authenticateToken, requireRole(...ROLE_GROUPS.ORDENES_READ), async (_req, res) => {
  const ordenes = await getOrdenes();
  res.json(ordenes);
});

module.exports = router;
