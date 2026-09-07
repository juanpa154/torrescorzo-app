const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/authorize.middleware');
const { ROLE_GROUPS } = require('../config/roles');
const {
  list,
  create,
  update,
  remove,
} = require('../controllers/employee.controller');

router.get('/', authenticateToken, requireRole(...ROLE_GROUPS.RRHH_READ), list);
router.post('/', authenticateToken, requireRole(...ROLE_GROUPS.RRHH_WRITE), create);
router.put('/:id', authenticateToken, requireRole(...ROLE_GROUPS.RRHH_WRITE), update);
router.delete('/:id', authenticateToken, requireRole(...ROLE_GROUPS.SOLO_ADMIN), remove);

module.exports = router;
