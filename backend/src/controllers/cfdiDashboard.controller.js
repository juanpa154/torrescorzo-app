const { PrismaClient } = require('@prisma/client');
const getCfdiPool = require('../db/cfdiPool');

const prisma = new PrismaClient();

function toNum(v) {
  if (v === null || v === undefined) return 0;
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
}

async function tieneSyncLocal(schema) {
  const [emi, rec] = await Promise.all([
    prisma.syncEstado.findUnique({ where: { schema_tipoCfdi: { schema, tipoCfdi: 'emitidos' } } }),
    prisma.syncEstado.findUnique({ where: { schema_tipoCfdi: { schema, tipoCfdi: 'recibidos' } } })
  ]);
  return emi?.ultimaSync != null && rec?.ultimaSync != null;
}

// ─── LOCAL (Prisma) ──────────────────────────────────────────────────────────

async function getDashboardLocal(schema, anio) {
  const year   = parseInt(anio) || new Date().getFullYear();
  const since  = new Date(year, 0, 1);
  const until  = new Date(year + 1, 0, 1);
  const sprev  = new Date(year - 1, 0, 1);
  const uprev  = new Date(year, 0, 1);

  const whereEmi     = { schema, fechaEmision: { gte: since, lt: until } };
  const whereRec     = { schema, fechaEmision: { gte: since, lt: until } };
  const whereEmiPrev = { schema, fechaEmision: { gte: sprev,  lt: uprev  } };
  const whereRecPrev = { schema, fechaEmision: { gte: sprev,  lt: uprev  } };

  const [
    resEmi, resRec, resEmiPrev, resRecPrev,
    mensualEmiRows, mensualRecRows,
    categorias, topClientes, topProveedores,
    tiposEmi, tiposRec
  ] = await Promise.all([

    prisma.cfdiEmitido.aggregate({
      where: whereEmi,
      _sum: { subtotal: true, iva16: true, totalRetenidos: true, total: true },
      _count: { _all: true }
    }),
    prisma.cfdiRecibido.aggregate({
      where: whereRec,
      _sum: { subtotal: true, iva16: true, totalRetenidos: true, total: true },
      _count: { _all: true }
    }),
    prisma.cfdiEmitido.aggregate({
      where: whereEmiPrev, _sum: { total: true }, _count: { _all: true }
    }),
    prisma.cfdiRecibido.aggregate({
      where: whereRecPrev, _sum: { total: true }, _count: { _all: true }
    }),

    // Monthly raw queries (Prisma groupBy no soporta EXTRACT nativo)
    prisma.$queryRaw`
      SELECT EXTRACT(MONTH FROM "fechaEmision")::int AS mes,
             COALESCE(SUM(total)::float8,  0) AS total,
             COALESCE(SUM(iva16)::float8,  0) AS iva16,
             COUNT(*)::int                    AS cantidad
      FROM   cfdi_emitidos
      WHERE  "schema" = ${schema}
        AND  "fechaEmision" >= ${since}
        AND  "fechaEmision" <  ${until}
      GROUP  BY 1 ORDER BY 1
    `,
    prisma.$queryRaw`
      SELECT EXTRACT(MONTH FROM "fechaEmision")::int AS mes,
             COALESCE(SUM(total)::float8,  0) AS total,
             COALESCE(SUM(iva16)::float8,  0) AS iva16,
             COUNT(*)::int                    AS cantidad
      FROM   cfdi_recibidos
      WHERE  "schema" = ${schema}
        AND  "fechaEmision" >= ${since}
        AND  "fechaEmision" <  ${until}
      GROUP  BY 1 ORDER BY 1
    `,

    prisma.cfdiRecibido.groupBy({
      by: ['categoriaIa'],
      where: { ...whereRec, categoriaIa: { not: null } },
      _sum: { total: true }, _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } }
    }),
    prisma.cfdiEmitido.groupBy({
      by: ['rfcReceptor'],
      where: { ...whereEmi, rfcReceptor: { not: null } },
      _sum: { total: true }, _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } }, take: 10
    }),
    prisma.cfdiRecibido.groupBy({
      by: ['rfcEmisor'],
      where: { ...whereRec, rfcEmisor: { not: null } },
      _sum: { total: true }, _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } }, take: 10
    }),
    prisma.cfdiEmitido.groupBy({
      by: ['tipo'],
      where: { ...whereEmi, tipo: { not: null } },
      _sum: { total: true }, _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } }
    }),
    prisma.cfdiRecibido.groupBy({
      by: ['tipo'],
      where: { ...whereRec, tipo: { not: null } },
      _sum: { total: true }, _count: { _all: true },
      orderBy: { _sum: { total: 'desc' } }
    })
  ]);

  return buildResponse({
    fuente: 'local', schema, anio: year,
    resEmi, resRec, resEmiPrev, resRecPrev,
    mensualEmiRows: Array.from(mensualEmiRows),
    mensualRecRows: Array.from(mensualRecRows),
    categorias:     categorias.map(c => ({ categoria: c.categoriaIa,  total: toNum(c._sum.total), cantidad: c._count._all })),
    topClientes:    topClientes.map(c => ({ rfc: c.rfcReceptor,        total: toNum(c._sum.total), cantidad: c._count._all })),
    topProveedores: topProveedores.map(c => ({ rfc: c.rfcEmisor,       total: toNum(c._sum.total), cantidad: c._count._all })),
    tiposEmi:       tiposEmi.map(t => ({ tipo: t.tipo, total: toNum(t._sum.total), cantidad: t._count._all })),
    tiposRec:       tiposRec.map(t => ({ tipo: t.tipo, total: toNum(t._sum.total), cantidad: t._count._all })),
  });
}

// ─── REMOTO (pg pool) ────────────────────────────────────────────────────────

async function getDashboardRemoto(schema, anio) {
  const pool = getCfdiPool();
  const year = parseInt(anio) || new Date().getFullYear();
  const yearPrev = year - 1;

  const [
    emiRes, recRes, emiPrevRes, recPrevRes,
    mensualEmiRes, mensualRecRes,
    catRes, cliRes, provRes, tiposEmiRes, tiposRecRes
  ] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(subtotal),0)::float AS subtotal, COALESCE(SUM(iva16),0)::float AS iva16,
              COALESCE(SUM(total_retenidos),0)::float AS total_retenidos,
              COALESCE(SUM(total),0)::float AS total, COUNT(*)::int AS cantidad
       FROM ${schema}.ing_eg_emi WHERE EXTRACT(YEAR FROM fecha_emision) = $1`, [year]
    ),
    pool.query(
      `SELECT COALESCE(SUM(subtotal),0)::float AS subtotal, COALESCE(SUM(iva16),0)::float AS iva16,
              COALESCE(SUM(total_retenidos),0)::float AS total_retenidos,
              COALESCE(SUM(total),0)::float AS total, COUNT(*)::int AS cantidad
       FROM ${schema}.ing_eg_rec WHERE EXTRACT(YEAR FROM fecha_emision) = $1`, [year]
    ),
    pool.query(
      `SELECT COALESCE(SUM(total),0)::float AS total, COUNT(*)::int AS cantidad
       FROM ${schema}.ing_eg_emi WHERE EXTRACT(YEAR FROM fecha_emision) = $1`, [yearPrev]
    ),
    pool.query(
      `SELECT COALESCE(SUM(total),0)::float AS total, COUNT(*)::int AS cantidad
       FROM ${schema}.ing_eg_rec WHERE EXTRACT(YEAR FROM fecha_emision) = $1`, [yearPrev]
    ),
    pool.query(
      `SELECT EXTRACT(MONTH FROM fecha_emision)::int AS mes,
              COALESCE(SUM(total),0)::float AS total, COALESCE(SUM(iva16),0)::float AS iva16,
              COUNT(*)::int AS cantidad
       FROM ${schema}.ing_eg_emi WHERE EXTRACT(YEAR FROM fecha_emision) = $1
       GROUP BY 1 ORDER BY 1`, [year]
    ),
    pool.query(
      `SELECT EXTRACT(MONTH FROM fecha_emision)::int AS mes,
              COALESCE(SUM(total),0)::float AS total, COALESCE(SUM(iva16),0)::float AS iva16,
              COUNT(*)::int AS cantidad
       FROM ${schema}.ing_eg_rec WHERE EXTRACT(YEAR FROM fecha_emision) = $1
       GROUP BY 1 ORDER BY 1`, [year]
    ),
    pool.query(
      `SELECT COALESCE(categoria_ia, 'Sin clasificar') AS categoria,
              COUNT(*)::int AS cantidad, COALESCE(SUM(total),0)::float AS total
       FROM ${schema}.ing_eg_rec WHERE EXTRACT(YEAR FROM fecha_emision) = $1
       GROUP BY 1 ORDER BY total DESC`, [year]
    ),
    pool.query(
      `SELECT rfc_receptor AS rfc, COUNT(*)::int AS cantidad, COALESCE(SUM(total),0)::float AS total
       FROM ${schema}.ing_eg_emi WHERE EXTRACT(YEAR FROM fecha_emision) = $1
         AND rfc_receptor IS NOT NULL
       GROUP BY 1 ORDER BY total DESC LIMIT 10`, [year]
    ),
    pool.query(
      `SELECT rfc_emisor AS rfc, COUNT(*)::int AS cantidad, COALESCE(SUM(total),0)::float AS total
       FROM ${schema}.ing_eg_rec WHERE EXTRACT(YEAR FROM fecha_emision) = $1
         AND rfc_emisor IS NOT NULL
       GROUP BY 1 ORDER BY total DESC LIMIT 10`, [year]
    ),
    pool.query(
      `SELECT tipo, COUNT(*)::int AS cantidad, COALESCE(SUM(total),0)::float AS total
       FROM ${schema}.ing_eg_emi WHERE EXTRACT(YEAR FROM fecha_emision) = $1
         AND tipo IS NOT NULL
       GROUP BY 1 ORDER BY total DESC`, [year]
    ),
    pool.query(
      `SELECT tipo, COUNT(*)::int AS cantidad, COALESCE(SUM(total),0)::float AS total
       FROM ${schema}.ing_eg_rec WHERE EXTRACT(YEAR FROM fecha_emision) = $1
         AND tipo IS NOT NULL
       GROUP BY 1 ORDER BY total DESC`, [year]
    ),
  ]);

  const emi = emiRes.rows[0], rec = recRes.rows[0];
  const emiP = emiPrevRes.rows[0], recP = recPrevRes.rows[0];

  // Wrap as Prisma-style to reuse buildResponse
  return buildResponse({
    fuente: 'remoto', schema, anio: year,
    resEmi:     { _sum: { subtotal: emi.subtotal, iva16: emi.iva16, totalRetenidos: emi.total_retenidos, total: emi.total }, _count: { _all: emi.cantidad } },
    resRec:     { _sum: { subtotal: rec.subtotal, iva16: rec.iva16, totalRetenidos: rec.total_retenidos, total: rec.total }, _count: { _all: rec.cantidad } },
    resEmiPrev: { _sum: { total: emiP.total }, _count: { _all: emiP.cantidad } },
    resRecPrev: { _sum: { total: recP.total }, _count: { _all: recP.cantidad } },
    mensualEmiRows: mensualEmiRes.rows,
    mensualRecRows: mensualRecRes.rows,
    categorias:     catRes.rows.map(r => ({ categoria: r.categoria, total: toNum(r.total), cantidad: Number(r.cantidad) })),
    topClientes:    cliRes.rows.map(r => ({ rfc: r.rfc, total: toNum(r.total), cantidad: Number(r.cantidad) })),
    topProveedores: provRes.rows.map(r => ({ rfc: r.rfc, total: toNum(r.total), cantidad: Number(r.cantidad) })),
    tiposEmi:       tiposEmiRes.rows.map(r => ({ tipo: r.tipo, total: toNum(r.total), cantidad: Number(r.cantidad) })),
    tiposRec:       tiposRecRes.rows.map(r => ({ tipo: r.tipo, total: toNum(r.total), cantidad: Number(r.cantidad) })),
  });
}

// ─── shared builder ──────────────────────────────────────────────────────────

function buildResponse({ fuente, schema, anio, resEmi, resRec, resEmiPrev, resRecPrev,
  mensualEmiRows, mensualRecRows, categorias, topClientes, topProveedores, tiposEmi, tiposRec }) {

  const fillMonths = (rows) => Array.from({ length: 12 }, (_, i) => {
    const m = rows.find(r => Number(r.mes) === i + 1) ?? {};
    return { mes: i + 1, total: toNum(m.total), iva16: toNum(m.iva16), cantidad: Number(m.cantidad ?? 0) };
  });

  const mensualEmitidos  = fillMonths(mensualEmiRows);
  const mensualRecibidos = fillMonths(mensualRecRows);

  return {
    fuente, schema, anio,
    resumenEmitidos: {
      total: toNum(resEmi._sum.total), subtotal: toNum(resEmi._sum.subtotal),
      iva16: toNum(resEmi._sum.iva16), totalRetenidos: toNum(resEmi._sum.totalRetenidos),
      cantidad: resEmi._count._all
    },
    resumenRecibidos: {
      total: toNum(resRec._sum.total), subtotal: toNum(resRec._sum.subtotal),
      iva16: toNum(resRec._sum.iva16), totalRetenidos: toNum(resRec._sum.totalRetenidos),
      cantidad: resRec._count._all
    },
    anioAnterior: {
      totalEmitidos:    toNum(resEmiPrev._sum.total),
      totalRecibidos:   toNum(resRecPrev._sum.total),
      cantidadEmitidos: resEmiPrev._count._all,
      cantidadRecibidos: resRecPrev._count._all
    },
    mensualEmitidos,
    mensualRecibidos,
    categorias,
    topClientes,
    topProveedores,
    tiposEmitidos: tiposEmi,
    tiposRecibidos: tiposRec,
  };
}

// ─── main export ─────────────────────────────────────────────────────────────

async function getDashboard(schema, anio) {
  if (await tieneSyncLocal(schema)) {
    return getDashboardLocal(schema, anio);
  }
  return getDashboardRemoto(schema, anio);
}

module.exports = { getDashboard };
