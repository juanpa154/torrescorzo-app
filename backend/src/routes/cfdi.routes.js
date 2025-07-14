const express = require('express');
const router = express.Router();
const { getCfdiIngresos } = require('../controllers/cfdi.controller');

router.get('/:schema/ingresos', async (req, res) => {
  const { schema } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;

  try {
    const result = await getCfdiIngresos(schema, page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener ingresos:', error);
    res.status(500).json({ message: 'Error al obtener los CFDI de ingresos' });
  }
});

module.exports = router;
