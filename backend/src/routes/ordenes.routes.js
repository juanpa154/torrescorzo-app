const express = require('express');
const router = express.Router();
const { getOrdenes } = require('../db');

router.get('/', async (_req, res) => {
  const ordenes = await getOrdenes();
  res.json(ordenes);
});

module.exports = router;
