const express = require('express');
const { sincronizarCfdis, obtenerEstado } = require('../services/cfdiSync.service');
const router = express.Router();

// POST /api/sync/ejecutar?schema=kia_zacatecas&tipo=emitidos|recibidos
router.post('/ejecutar', async (req, res) => {
  const { schema, tipo = 'recibidos' } = req.query;
  if (!schema) return res.status(400).json({ error: 'Falta el parámetro schema' });

  try {
    const resultado = await sincronizarCfdis(schema, tipo);
    res.json({ ...resultado, schema, tipo });
  } catch (err) {
    console.error('Error en sincronización:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sync/estado?schema=kia_zacatecas
router.get('/estado', async (req, res) => {
  const { schema } = req.query;
  if (!schema) return res.status(400).json({ error: 'Falta el parámetro schema' });

  try {
    const estado = await obtenerEstado(schema);
    res.json(estado);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
