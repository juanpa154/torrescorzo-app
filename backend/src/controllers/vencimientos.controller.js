const client = require("../db/remoteClient");

const listVencimientos = async (req, res) => {
  const { cuent, desde, hasta } = req.query;

  let query = "SELECT * FROM ventas_gatlcelren WHERE 1=1";
  const values = [];

  if (cuent) {
    values.push(cuent);
    query += ` AND cuent = $${values.length}`;
  }

  if (desde) {
    values.push(desde);
    query += ` AND fec_venc >= $${values.length}`;
  }

  if (hasta) {
    values.push(hasta);
    query += ` AND fec_venc <= $${values.length}`;
  }

  try {
    const result = await client.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error al consultar vencimientos" });
  }
};

module.exports = { listVencimientos };
