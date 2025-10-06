const getCfdiClient = require('../db/cfdiClient');

// =====================================
// FUNCIÓN PARA CFDI EMITIDOS (ingresos)
// =====================================
async function getCfdiIngresos(schema, page = 1, limit = 50, filtros = {}) {
  const client = getCfdiClient(schema);
  const offset = (page - 1) * limit;

  try {
    await client.connect();

    const condiciones = [];
    const valores = [];
    let i = 1;

    // Filtros dinámicos
    if (filtros.mes) {
      condiciones.push(`EXTRACT(MONTH FROM fecha_emision) = $${i++}`);
      valores.push(filtros.mes);
    }

    if (filtros.anio) {
      condiciones.push(`EXTRACT(YEAR FROM fecha_emision) = $${i++}`);
      valores.push(filtros.anio);
    }

    if (filtros.tipo) {
      condiciones.push(`tipo = $${i++}`);
      valores.push(filtros.tipo);
    }

    if (filtros.rfc) {
      condiciones.push(`rfc_receptor ILIKE $${i++}`);
      valores.push(`%${filtros.rfc}%`);
    }

    if (filtros.minMonto) {
      condiciones.push(`total >= $${i++}`);
      valores.push(filtros.minMonto);
    }

    if (filtros.maxMonto) {
      condiciones.push(`total <= $${i++}`);
      valores.push(filtros.maxMonto);
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    // Consulta paginada
    const query = `
      SELECT * FROM ing_eg_emi
      ${whereClause}
      ORDER BY fecha_emision DESC
      LIMIT $${i++}
      OFFSET $${i++}
    `;
    const paginatedValues = [...valores, limit, offset];
    const result = await client.query(query, paginatedValues);

    // Conteo total
    const countQuery = `SELECT COUNT(*) FROM ing_eg_emi ${whereClause}`;
    const countResult = await client.query(countQuery, valores);

    // Resumen
    const resumenQuery = `
      SELECT 
        COALESCE(SUM(subtotal), 0) AS subtotal,
        COALESCE(SUM(iva16), 0) AS iva16,
        COALESCE(SUM(total_retenidos), 0) AS retenidos,
        COALESCE(SUM(total), 0) AS total
      FROM ing_eg_emi
      ${whereClause}
    `;
    const resumenResult = await client.query(resumenQuery, valores);

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

// =====================================
// FUNCIÓN PARA CFDI RECIBIDOS
// =====================================
async function getCfdiRecibidos(schema, page = 1, limit = 50, filtros = {}) {4
  const client = getCfdiClient(schema);
  const offset = (page - 1) * limit;

  try {
    await client.connect();

    const condiciones = [];
    const valores = [];
    let i = 1;

    // Filtros dinámicos
    if (filtros.mes) {
      condiciones.push(`EXTRACT(MONTH FROM fecha_emision) = $${i++}`);
      valores.push(filtros.mes);
    }

    if (filtros.anio) {
      condiciones.push(`EXTRACT(YEAR FROM fecha_emision) = $${i++}`);
      valores.push(filtros.anio);
    }

    if (filtros.tipo) {
      condiciones.push(`tipo = $${i++}`);
      valores.push(filtros.tipo);
    }

    if (filtros.rfc) {
      condiciones.push(`rfc_emisor ILIKE $${i++}`);
      valores.push(`%${filtros.rfc}%`);
    }

    if (filtros.minMonto) {
      condiciones.push(`total >= $${i++}`);
      valores.push(filtros.minMonto);
    }

    if (filtros.maxMonto) {
      condiciones.push(`total <= $${i++}`);
      valores.push(filtros.maxMonto);
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    // Consulta paginada
    const query = `
      SELECT * FROM ing_eg_rec
      ${whereClause}
      ORDER BY fecha_emision DESC
      LIMIT $${i++}
      OFFSET $${i++}
    `;
    const paginatedValues = [...valores, limit, offset];
    const result = await client.query(query, paginatedValues);

    // Conteo total
    const countQuery = `SELECT COUNT(*) FROM ing_eg_rec ${whereClause}`;
    const countResult = await client.query(countQuery, valores);

    // Resumen
    const resumenQuery = `
      SELECT 
        COALESCE(SUM(subtotal), 0) AS subtotal,
        COALESCE(SUM(iva16), 0) AS iva16,
        COALESCE(SUM(total_retenidos), 0) AS retenidos,
        COALESCE(SUM(total), 0) AS total
      FROM ing_eg_rec
      ${whereClause}
    `;
    const resumenResult = await client.query(resumenQuery, valores);

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      resumen: resumenResult.rows[0],
      page,
      limit
    };

  } catch (error) {
    console.error(`Error al consultar recibidos para el esquema "${schema}":`, error);
    throw error;
  } finally {
    await client.end();
  }
}

// Exportar ambas funciones
module.exports = {
  getCfdiIngresos,
  getCfdiRecibidos
};
