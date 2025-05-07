const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    message: 'Acceso autorizado a perfil privado',
    userId: req.user.id
  });
});

module.exports = router;
