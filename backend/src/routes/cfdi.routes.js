const express = require('express');
const router = express.Router();
const { getCfdiIngresos } = require('../controllers/cfdi.controller');

router.get('/:schema/ingresos', async (req, res) => {
  const { schema } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  // Captura de filtros
  const mes = req.query.mes ? parseInt(req.query.mes) : null;
  const anio = req.query.anio ? parseInt(req.query.anio) : null;
  const tipo = req.query.tipo || null;
  const rfc = req.query.rfc || null;
  const minMonto = req.query.minMonto || null;
  const maxMonto = req.query.maxMonto || null;

  try {
    const result = await getCfdiIngresos(schema, page, limit, {
      mes,
      anio,
      tipo,
      rfc,
      minMonto,
      maxMonto
    });

    res.json(result);
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    res.status(500).json({ message: 'Error al obtener los CFDI de ingresos' });
  }
});


module.exports = router;
