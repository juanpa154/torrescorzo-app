const getCfdiClient = require('../db/cfdiClient');

async function getCfdiIngresos(schema, page = 1, limit = 50, filters = {}) {
  const client = getCfdiClient(schema);
  const offset = (page - 1) * limit;
  const { mes, anio } = filters;

  try {
    await client.connect();

    // ----------- Construcción dinámica de filtros -----------
    const conditions = [];
    const filterValues = [];

    if (mes) {
      conditions.push(`EXTRACT(MONTH FROM fecha_emision) = $${filterValues.length + 1}`);
      filterValues.push(mes);
    }

    if (anio) {
      conditions.push(`EXTRACT(YEAR FROM fecha_emision) = $${filterValues.length + 1}`);
      filterValues.push(anio);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // ----------- Query de datos paginados -----------
    const paginatedQuery = `
      SELECT * FROM ing_eg_emi
      ${whereClause}
      ORDER BY fecha_emision DESC
      LIMIT $${filterValues.length + 1}
      OFFSET $${filterValues.length + 2}
    `;

    const paginatedValues = [...filterValues, limit, offset];
    const result = await client.query(paginatedQuery, paginatedValues);

    // ----------- Query de conteo -----------
    const countQuery = `
      SELECT COUNT(*) FROM ing_eg_emi
      ${whereClause}
    `;
    const countResult = await client.query(countQuery, filterValues);

    // ----------- Query de resumen -----------
    const resumenQuery = `
      SELECT 
        COALESCE(SUM(subtotal), 0) AS subtotal,
        COALESCE(SUM(iva16), 0) AS iva16,
        COALESCE(SUM(total_retenidos), 0) AS retenidos,
        COALESCE(SUM(total), 0) AS total
      FROM ing_eg_emi
      ${whereClause}
    `;
    const resumenResult = await client.query(resumenQuery, filterValues);

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      resumen: resumenResult.rows[0],
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
