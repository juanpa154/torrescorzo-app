const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const { create, list, getById } = require('../controllers/announcement.controller');

router.get('/', list); // público
router.get('/:id', getById); // público
router.post('/', authenticateToken, create); // solo autenticado

module.exports = router;
