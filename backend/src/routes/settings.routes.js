const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { ROLE_GROUPS } = require('../config/roles');
const {
  listSettings, addAgency, addLocation,
  removeAgency, removeLocation
} = require('../controllers/settings.controller');

router.get('/', authenticateToken, requireRole(...ROLE_GROUPS.CONFIG_READ), listSettings);
router.post('/agency', authenticateToken, requireRole(...ROLE_GROUPS.SOLO_ADMIN), addAgency);
router.post('/location', authenticateToken, requireRole(...ROLE_GROUPS.SOLO_ADMIN), addLocation);
router.delete('/agency/:id', authenticateToken, requireRole(...ROLE_GROUPS.SOLO_ADMIN), removeAgency);
router.delete('/location/:id', authenticateToken, requireRole(...ROLE_GROUPS.SOLO_ADMIN), removeLocation);

module.exports = router;
