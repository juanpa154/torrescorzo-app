const express = require('express');
const { clasificarCfdisSinCategoria } = require('../jobs/clasificarMasivo');
const router = express.Router();

// GET /api/ia/clasificar?schema=kia_zacatecas&tipo=recibidos|emitidos&limit=50
router.get('/clasificar', async (req, res) => {
  const { schema, tipo = 'recibidos', limit } = req.query;
  if (!schema) {
    return res.status(400).json({ error: 'Falta el parámetro schema' });
  }

  const cantidad = parseInt(limit, 10) || 1000;

  try {
    const resultado = await clasificarCfdisSinCategoria(schema, cantidad, tipo);
    res.json({ ...resultado, schema, tipo, limite: cantidad });
  } catch (err) {
    console.error('[Clasificar] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
