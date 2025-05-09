const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const {
  listSettings, addAgency, addLocation,
  removeAgency, removeLocation
} = require('../controllers/settings.controller');

router.get('/', authenticateToken, listSettings);
router.post('/agency', authenticateToken, addAgency);
router.post('/location', authenticateToken, addLocation);
router.delete('/agency/:id', authenticateToken, removeAgency);
router.delete('/location/:id', authenticateToken, removeLocation);

module.exports = router;
