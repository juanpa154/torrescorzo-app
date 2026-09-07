const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { validateBody } = require('../middlewares/validate');
const { updateRoleSchema } = require('../schemas/user.schema');
const { ROLE_GROUPS } = require('../config/roles');
const { getAllUsers, updateUserRole } = require('../controllers/user.controller');

router.get('/', authenticateToken, requireRole(...ROLE_GROUPS.SOLO_ADMIN), getAllUsers);
router.put('/:id/role', authenticateToken, requireRole(...ROLE_GROUPS.SOLO_ADMIN), validateBody(updateRoleSchema), updateUserRole);

module.exports = router;
