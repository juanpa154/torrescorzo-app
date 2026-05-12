const { PrismaClient } = require('@prisma/client');
const getCfdiClient = require('../db/cfdiClient');
const { clasificarLoteCfdi } = require('../helpers/cfdiClassifier');

const prisma = new PrismaClient();

const MODEL_MAP = {
  emitidos: 'cfdiEmitido',
  recibidos: 'cfdiRecibido'
};

async function clasificarCfdisSinCategoria(schema, limiteCuantos = 50, tipo = 'recibidos') {
  const modelName = MODEL_MAP[tipo];
  if (!modelName) throw new Error(`Tipo inválido: ${tipo}`);

  // Verificar si hay datos locales sincronizados
  const syncEstado = await prisma.syncEstado.findUnique({
    where: { schema_tipoCfdi: { schema, tipoCfdi: tipo } }
  });

  if (syncEstado?.ultimaSync) {
    return clasificarDesdeLocal(schema, limiteCuantos, tipo, modelName);
  }

  // Sin datos locales: usar BD remota (solo recibidos soportado en remoto)
  if (tipo === 'recibidos') {
    return clasificarDesdeRemoto(schema, limiteCuantos);
  }

  return { clasificados: 0, mensaje: 'Primero ejecuta la sincronización para clasificar emitidos' };
}

async function clasificarDesdeLocal(schema, limiteCuantos, tipo, modelName) {
  const registros = await prisma[modelName].findMany({
    where: { schema, categoriaIa: null, conceptos: { not: null } },
    take: limiteCuantos,
    select: { id: true, uuid: true, conceptos: true }
  });

  console.log(`[Clasificar-Local] ${schema}/${tipo}: ${registros.length} CFDI(s) sin clasificar`);
  if (registros.length === 0) return { clasificados: 0 };

  const categorias = await clasificarLoteCfdi(registros.map(r => r.conceptos));

  if (categorias.length !== registros.length) {
    throw new Error('Desajuste entre conceptos y categorías devueltas por OpenAI');
  }

  // Actualizar BD local
  await prisma.$transaction(
    registros.map((r, i) =>
      prisma[modelName].update({
        where: { id: r.id },
        data: { categoriaIa: categorias[i] }
      })
    )
  );

  // Para recibidos: también actualizar BD remota para mantener sincronía
  if (tipo === 'recibidos') {
    const client = getCfdiClient(schema);
    try {
      await client.connect();
      for (let i = 0; i < registros.length; i++) {
        await client.query(
          `UPDATE ing_eg_rec SET categoria_ia = $1 WHERE uuid = $2`,
          [categorias[i], registros[i].uuid]
        ).catch(err => console.error(`[Clasificar] Error remoto ${registros[i].uuid}:`, err.message));
      }
    } finally {
      await client.end();
    }
  }

  console.log(`[Clasificar-Local] Clasificados: ${registros.length}`);
  return { clasificados: registros.length };
}

async function clasificarDesdeRemoto(schema, limiteCuantos) {
  const client = getCfdiClient(schema);

  try {
    await client.connect();

    const { rows } = await client.query(
      `SELECT uuid, conceptos FROM ing_eg_rec WHERE categoria_ia IS NULL AND conceptos IS NOT NULL LIMIT $1`,
      [limiteCuantos]
    );

    console.log(`[Clasificar-Remoto] ${schema}: ${rows.length} CFDI(s) sin clasificar`);
    if (rows.length === 0) return { clasificados: 0 };

    const categorias = await clasificarLoteCfdi(rows.map(r => r.conceptos));

    if (categorias.length !== rows.length) {
      throw new Error('Desajuste entre conceptos y categorías devueltas por OpenAI');
    }

    for (let i = 0; i < rows.length; i++) {
      await client.query(
        `UPDATE ing_eg_rec SET categoria_ia = $1 WHERE uuid = $2`,
        [categorias[i], rows[i].uuid]
      ).catch(err => console.error(`[Clasificar] Error ${rows[i].uuid}:`, err.message));
    }

    return { clasificados: rows.length };
  } finally {
    await client.end();
  }
}

module.exports = { clasificarCfdisSinCategoria };
