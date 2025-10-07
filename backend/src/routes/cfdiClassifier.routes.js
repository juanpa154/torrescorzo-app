const express = require('express');
const { clasificarCfdisSinCategoria } = require('../jobs/clasificarMasivo');
const router = express.Router();
// http://localhost:3000/api/ia/clasificar?schema=kia_zacatecas&limit=25
router.get('/clasificar', async (req, res) => {
  const { schema, limit } = req.query;
  if (!schema) {
    return res.status(400).json({ error: 'Falta el parámetro schema' });
  }

  const cantidad = parseInt(limit, 10) || 25;

  await clasificarCfdisSinCategoria(schema, cantidad);
  res.json({ mensaje: `Clasificación ejecutada para ${schema}. Límite: ${cantidad}` });
});

module.exports = router;