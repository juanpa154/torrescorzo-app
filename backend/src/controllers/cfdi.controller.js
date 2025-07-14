const getCfdiClient = require('../db/cfdiClient');

async function getCfdiIngresos(schema, page = 1, limit = 50) {
  const client = getCfdiClient(schema);
  const offset = (page - 1) * limit;

  try {
    await client.connect();

    const result = await client.query(
      `SELECT * FROM ing_eg_emi ORDER BY fecha_emision DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await client.query(
      `SELECT COUNT(*) FROM ing_eg_emi`
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page,
      limit
    };
  } catch (error) {
    console.error(`Error al consultar ingresos para el esquema "${schema}":`, error);
    throw error;
  } finally {
    await client.end();
  }
}

module.exports = {
  getCfdiIngresos
};
