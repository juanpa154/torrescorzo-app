const { PrismaClient } = require('@prisma/client');
const getCfdiClient = require('../db/cfdiClient');

const prisma = new PrismaClient();

const CATEGORIAS_IA = [
  'Combustible', 'Vehículos Nuevos', 'Refacciones y mantenimiento',
  'Servicios profesionales y administrativos', 'Publicidad y marketing',
  'Arrendamiento', 'Gastos de operación', 'Servicios de transporte',
  'Consumo interno y alimentos', 'Servicios técnicos y mantenimiento',
  'Tecnología y comunicaciones', 'Intereses y comisiones',
  'Anticipos y pagos aplicados', 'Otro'
];

module.exports.CATEGORIAS_IA = CATEGORIAS_IA;

async function tieneDatosLocales(schema, tipoCfdi) {
  const estado = await prisma.syncEstado.findUnique({
    where: { schema_tipoCfdi: { schema, tipoCfdi } }
  });
  return estado?.ultimaSync != null;
}

function buildDateFilter(mes, anio) {
  if (mes && anio) {
    return {
      gte: new Date(parseInt(anio), parseInt(mes) - 1, 1),
      lt: new Date(parseInt(anio), parseInt(mes), 1)
    };
  }
  if (anio) {
    const y = parseInt(anio);
    return { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
  }
  return null;
}

// =====================================
// FUNCIÓN PARA CFDI EMITIDOS (ingresos)
// =====================================
async function getCfdiIngresos(schema, page = 1, limit = 50, filtros = {}) {
  const { mes, anio, tipo, rfc, minMonto, maxMonto, categoriaIa } = filtros;

  if (await tieneDatosLocales(schema, 'emitidos')) {
    const offset = (page - 1) * limit;
    const where = { schema };

    const dateFilter = buildDateFilter(mes, anio);
    if (dateFilter) {
      where.fechaEmision = dateFilter;
    } else if (mes && !anio) {
      // mes sin año: no se puede filtrar eficientemente en Prisma, usar remoto
      return getCfdiIngresosRemoto(schema, page, limit, filtros);
    }

    if (tipo) where.tipo = tipo;
    if (rfc) where.rfcReceptor = { contains: rfc, mode: 'insensitive' };
    if (categoriaIa === 'sin_clasificar') {
      where.categoriaIa = null;
    } else if (categoriaIa) {
      where.categoriaIa = categoriaIa;
    }
    if (minMonto || maxMonto) {
      where.total = {};
      if (minMonto) where.total.gte = parseFloat(minMonto);
      if (maxMonto) where.total.lte = parseFloat(maxMonto);
    }

    const [records, total, agg] = await Promise.all([
      prisma.cfdiEmitido.findMany({
        where,
        orderBy: { fechaEmision: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.cfdiEmitido.count({ where }),
      prisma.cfdiEmitido.aggregate({
        where,
        _sum: { subtotal: true, iva16: true, totalRetenidos: true, total: true }
      })
    ]);

    return {
      data: records.map(r => ({
        ...r.datos,
        categoria_ia: r.categoriaIa ?? r.datos?.categoria_ia ?? null
      })),
      total,
      resumen: {
        subtotal: Number(agg._sum.subtotal) || 0,
        iva16: Number(agg._sum.iva16) || 0,
        retenidos: Number(agg._sum.totalRetenidos) || 0,
        total: Number(agg._sum.total) || 0
      },
      page,
      limit,
      fuente: 'local'
    };
  }

  return getCfdiIngresosRemoto(schema, page, limit, filtros);
}

async function getCfdiIngresosRemoto(schema, page = 1, limit = 50, filtros = {}) {
  const client = getCfdiClient(schema);
  const offset = (page - 1) * limit;

  try {
    await client.connect();

    const condiciones = [];
    const valores = [];
    let i = 1;

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

    const query = `SELECT * FROM ing_eg_emi ${whereClause} ORDER BY fecha_emision DESC LIMIT $${i++} OFFSET $${i++}`;
    const result = await client.query(query, [...valores, limit, offset]);

    const countResult = await client.query(`SELECT COUNT(*) FROM ing_eg_emi ${whereClause}`, valores);

    const resumenResult = await client.query(
      `SELECT COALESCE(SUM(subtotal),0) AS subtotal, COALESCE(SUM(iva16),0) AS iva16,
              COALESCE(SUM(total_retenidos),0) AS retenidos, COALESCE(SUM(total),0) AS total
       FROM ing_eg_emi ${whereClause}`,
      valores
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      resumen: resumenResult.rows[0],
      page,
      limit,
      fuente: 'remoto'
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
async function getCfdiRecibidos(schema, page = 1, limit = 50, filtros = {}) {
  const { mes, anio, tipo, rfc, minMonto, maxMonto, categoriaIa } = filtros;

  if (await tieneDatosLocales(schema, 'recibidos')) {
    const offset = (page - 1) * limit;
    const where = { schema };

    const dateFilter = buildDateFilter(mes, anio);
    if (dateFilter) {
      where.fechaEmision = dateFilter;
    } else if (mes && !anio) {
      return getCfdiRecibidosRemoto(schema, page, limit, filtros);
    }

    if (tipo) where.tipo = tipo;
    if (rfc) where.rfcEmisor = { contains: rfc, mode: 'insensitive' };
    if (categoriaIa === 'sin_clasificar') {
      where.categoriaIa = null;
    } else if (categoriaIa) {
      where.categoriaIa = categoriaIa;
    }
    if (minMonto || maxMonto) {
      where.total = {};
      if (minMonto) where.total.gte = parseFloat(minMonto);
      if (maxMonto) where.total.lte = parseFloat(maxMonto);
    }

    const [records, total, agg] = await Promise.all([
      prisma.cfdiRecibido.findMany({
        where,
        orderBy: { fechaEmision: 'desc' },
        skip: offset,
        take: limit
      }),
      prisma.cfdiRecibido.count({ where }),
      prisma.cfdiRecibido.aggregate({
        where,
        _sum: { subtotal: true, iva16: true, totalRetenidos: true, total: true }
      })
    ]);

    return {
      data: records.map(r => ({
        ...r.datos,
        categoria_ia: r.categoriaIa ?? r.datos?.categoria_ia ?? null
      })),
      total,
      resumen: {
        subtotal: Number(agg._sum.subtotal) || 0,
        iva16: Number(agg._sum.iva16) || 0,
        retenidos: Number(agg._sum.totalRetenidos) || 0,
        total: Number(agg._sum.total) || 0
      },
      page,
      limit,
      fuente: 'local'
    };
  }

  return getCfdiRecibidosRemoto(schema, page, limit, filtros);
}

async function getCfdiRecibidosRemoto(schema, page = 1, limit = 50, filtros = {}) {
  const client = getCfdiClient(schema);
  const offset = (page - 1) * limit;

  try {
    await client.connect();

    const condiciones = [];
    const valores = [];
    let i = 1;

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

    const query = `SELECT * FROM ing_eg_rec ${whereClause} ORDER BY fecha_emision DESC LIMIT $${i++} OFFSET $${i++}`;
    const result = await client.query(query, [...valores, limit, offset]);

    const countResult = await client.query(`SELECT COUNT(*) FROM ing_eg_rec ${whereClause}`, valores);

    const resumenResult = await client.query(
      `SELECT COALESCE(SUM(subtotal),0) AS subtotal, COALESCE(SUM(iva16),0) AS iva16,
              COALESCE(SUM(total_retenidos),0) AS retenidos, COALESCE(SUM(total),0) AS total
       FROM ing_eg_rec ${whereClause}`,
      valores
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      resumen: resumenResult.rows[0],
      page,
      limit,
      fuente: 'remoto'
    };
  } catch (error) {
    console.error(`Error al consultar recibidos para el esquema "${schema}":`, error);
    throw error;
  } finally {
    await client.end();
  }
}

module.exports = {
  getCfdiIngresos,
  getCfdiRecibidos
};
