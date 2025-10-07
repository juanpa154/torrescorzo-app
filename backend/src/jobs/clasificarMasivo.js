const getCfdiClient = require('../db/cfdiClient');
const { clasificarLoteCfdi } = require('../helpers/cfdiClassifier');

/**
 * Clasifica en lote los CFDI que no tienen categoría_ia aún
 * @param {string} schema Nombre del esquema (ej. 'kia_zacatecas')
 * @param {number} limiteCuantos Límite de CFDIs a procesar por ejecución
 */
async function clasificarCfdisSinCategoria(schema, limiteCuantos = 50) {
  const client = getCfdiClient(schema);

  try {
    await client.connect();

    // 1. Obtener CFDIs sin categoría_ia
    const { rows } = await client.query(`
      SELECT uuid, conceptos FROM ing_eg_rec 
      WHERE categoria_ia IS NULL 
      AND conceptos IS NOT NULL 
      LIMIT $1
    `, [limiteCuantos]);

    console.log(`Encontrados ${rows.length} CFDI(s) sin clasificar.`);

    if (rows.length === 0) return;

    // 2. Preparamos descripciones
    const descripciones = rows.map(r => r.conceptos);

    // 3. Clasificamos por lote
    const categorias = await clasificarLoteCfdi(descripciones);

    if (categorias.length !== rows.length) {
      throw new Error('Desajuste entre conceptos y categorías devueltas por OpenAI');
    }

    // 4. Actualizamos uno por uno
    for (let i = 0; i < rows.length; i++) {
      const { uuid } = rows[i];
      const categoria = categorias[i];

      try {
        await client.query(`
          UPDATE ing_eg_rec SET categoria_ia = $1 WHERE uuid = $2
        `, [categoria, uuid]);

        console.log(`✅ ${uuid} → ${categoria}`);
      } catch (updateErr) {
        console.error(`❌ Error al actualizar ${uuid}:`, updateErr.message);
      }
    }

  } catch (err) {
    console.error(`Error general en clasificación masiva [${schema}]:`, err.message);
  } finally {
    await client.end();
  }
}

module.exports = { clasificarCfdisSinCategoria };
