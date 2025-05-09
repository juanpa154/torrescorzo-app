const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
  list,
  create,
  update,
  remove,
} = require('../controllers/employee.controller');

router.get('/', authenticateToken, list);
router.post('/', authenticateToken, create);
router.put('/:id', authenticateToken, update);
router.delete('/:id', authenticateToken, remove);

module.exports = router;
