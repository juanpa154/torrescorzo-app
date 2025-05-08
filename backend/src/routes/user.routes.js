const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { getAllUsers, updateUserRole } = require('../controllers/user.controller');

router.get('/', authenticateToken, getAllUsers);
router.put('/:id/role', authenticateToken, updateUserRole);

module.exports = router;
