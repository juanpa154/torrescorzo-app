const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { ROLE_GROUPS } = require('../config/roles');
const { create, list, getById } = require('../controllers/announcement.controller');

router.get('/', authenticateToken, requireRole(...ROLE_GROUPS.ANUNCIOS_READ), list);
router.get('/:id', authenticateToken, requireRole(...ROLE_GROUPS.ANUNCIOS_READ), getById);
router.post('/', authenticateToken, requireRole(...ROLE_GROUPS.ANUNCIOS_WRITE), create);

module.exports = router;
