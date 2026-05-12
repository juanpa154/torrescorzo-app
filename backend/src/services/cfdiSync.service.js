const { PrismaClient } = require('@prisma/client');
const getCfdiPool = require('../db/cfdiPool');

const prisma = new PrismaClient();

const TABLA_MAP = {
  emitidos: 'ing_eg_emi',
  recibidos: 'ing_eg_rec'
};

const MODEL_MAP = {
  emitidos: 'cfdiEmitido',
  recibidos: 'cfdiRecibido'
};

function mapRow(row, schema) {
  return {
    schema,
    fechaEmision: row.fecha_emision ? new Date(row.fecha_emision) : null,
    tipo: row.tipo || null,
    rfcReceptor: row.rfc_receptor || null,
    rfcEmisor: row.rfc_emisor || null,
    subtotal: row.subtotal != null ? row.subtotal : null,
    iva16: row.iva16 != null ? row.iva16 : null,
    totalRetenidos: row.total_retenidos != null ? row.total_retenidos : null,
    total: row.total != null ? row.total : null,
    conceptos: row.conceptos || null,
    categoriaIa: row.categoria_ia || null,
    datos: row,
    sincronizadoAt: new Date()
  };
}

async function sincronizarCfdis(schema, tipo = 'recibidos') {
  const tabla = TABLA_MAP[tipo];
  const modelName = MODEL_MAP[tipo];
  if (!tabla) throw new Error(`Tipo inválido: ${tipo}`);

  const pool = getCfdiPool();

  const estado = await prisma.syncEstado.findUnique({
    where: { schema_tipoCfdi: { schema, tipoCfdi: tipo } }
  });

  await prisma.syncEstado.upsert({
    where: { schema_tipoCfdi: { schema, tipoCfdi: tipo } },
    create: { schema, tipoCfdi: tipo, enProgreso: true },
    update: { enProgreso: true }
  });

  try {
    let query, params = [];

    if (estado?.ultimaSync) {
      // Incremental: retrocede 1 día para capturar CFDIs con timbrado tardío
      const desde = new Date(estado.ultimaSync);
      desde.setDate(desde.getDate() - 1);
      query = `SELECT * FROM ${schema}.${tabla} WHERE fecha_emision >= $1 ORDER BY fecha_emision ASC`;
      params = [desde];
    } else {
      query = `SELECT * FROM ${schema}.${tabla} ORDER BY fecha_emision ASC`;
    }

    const { rows } = await pool.query(query, params);
    console.log(`[Sync] ${schema}/${tipo}: ${rows.length} registros encontrados en remoto`);

    const BATCH_SIZE = 50;
    let count = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE).filter(r => r.uuid);
      if (batch.length === 0) continue;

      await prisma.$transaction(
        batch.map(row =>
          prisma[modelName].upsert({
            where: { uuid_schema: { uuid: row.uuid, schema } },
            create: { uuid: row.uuid, ...mapRow(row, schema) },
            update: mapRow(row, schema)
          })
        )
      );
      count += batch.length;
    }

    await prisma.syncEstado.update({
      where: { schema_tipoCfdi: { schema, tipoCfdi: tipo } },
      data: { ultimaSync: new Date(), totalSincronizados: count, enProgreso: false }
    });

    console.log(`[Sync] ${schema}/${tipo}: ${count} registros sincronizados`);
    return { sincronizados: count };
  } catch (err) {
    await prisma.syncEstado.update({
      where: { schema_tipoCfdi: { schema, tipoCfdi: tipo } },
      data: { enProgreso: false }
    }).catch(() => {});
    throw err;
  }
}

async function obtenerEstado(schema) {
  const estados = await prisma.syncEstado.findMany({ where: { schema } });

  const [pendientesEmitidos, pendientesRecibidos] = await Promise.all([
    prisma.cfdiEmitido.count({
      where: { schema, categoriaIa: null, conceptos: { not: null } }
    }),
    prisma.cfdiRecibido.count({
      where: { schema, categoriaIa: null, conceptos: { not: null } }
    })
  ]);

  return {
    estados,
    pendientes: { emitidos: pendientesEmitidos, recibidos: pendientesRecibidos }
  };
}

module.exports = { sincronizarCfdis, obtenerEstado };
