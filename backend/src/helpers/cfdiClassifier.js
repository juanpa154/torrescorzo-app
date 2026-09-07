const { openai } = require('../config/openaiClient');

const CATEGORIAS = [
  'Combustible', 'Vehículos Nuevos', 'Refacciones y mantenimiento',
  'Servicios profesionales y administrativos', 'Publicidad y marketing',
  'Arrendamiento', 'Gastos de operación', 'Servicios de transporte',
  'Consumo interno y alimentos', 'Servicios técnicos y mantenimiento',
  'Tecnología y comunicaciones', 'Intereses y comisiones',
  'Anticipos y pagos aplicados', 'Otro'
];

const PROMPT_SISTEMA = `Eres un contador experto en CFDI de agencias automotrices (Kia).
Clasifica cada concepto en una de estas categorías:
${CATEGORIAS.join(', ')}

Reglas:
- Usa criterio contable estricto.
- Si no hay coincidencia clara usa "Otro".
- Devuelve SOLO la lista numerada de categorías, sin texto adicional:
  1. Categoría
  2. Categoría
  ...`;

async function clasificarBatch(descripciones) {
  const lista = descripciones
    .map((d, i) => `${i + 1}. ${d?.toString().replace(/\s+/g, ' ').trim() || '(sin descripción)'}`)
    .join('\n');

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: PROMPT_SISTEMA },
      { role: 'user', content: `Conceptos:\n${lista}` }
    ],
    temperature: 0.1,
    max_tokens: Math.max(descripciones.length * 15, 200)
  });

  const lineas = completion.choices[0].message.content
    .split('\n')
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  // Si OpenAI devuelve menos líneas por corte, rellenar con 'Otro'
  while (lineas.length < descripciones.length) {
    lineas.push('Otro');
  }

  return lineas.slice(0, descripciones.length);
}

/**
 * Clasifica una lista de conceptos de CFDI usando GPT-4o-mini.
 * Procesa en lotes de 50 para no exceder max_tokens.
 */
async function clasificarLoteCfdi(descripciones) {
  const BATCH_SIZE = 50;
  const resultados = [];

  for (let i = 0; i < descripciones.length; i += BATCH_SIZE) {
    const batch = descripciones.slice(i, i + BATCH_SIZE);
    const categorias = await clasificarBatch(batch);
    resultados.push(...categorias);
  }

  return resultados;
}

module.exports = { clasificarLoteCfdi };
