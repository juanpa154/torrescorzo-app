const express = require('express');
const router = express.Router();
const { listVencimientos } = require('../controllers/vencimientos.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { ROLE_GROUPS } = require('../config/roles');

router.get('/', authenticateToken, requireRole(...ROLE_GROUPS.VENCIMIENTOS_READ), listVencimientos);

module.exports = router;
