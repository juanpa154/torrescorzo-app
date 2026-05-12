const express = require('express');
const { getDashboard } = require('../controllers/cfdiDashboard.controller');
const router = express.Router();

// GET /api/cfdi-dashboard?schema=kia_zacatecas&anio=2025
router.get('/', async (req, res) => {
  const { schema, anio } = req.query;
  if (!schema) return res.status(400).json({ error: 'Falta el parámetro schema' });

  try {
    const data = await getDashboard(schema, anio);
    res.json(data);
  } catch (err) {
    console.error('[Dashboard] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
