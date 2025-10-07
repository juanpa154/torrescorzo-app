const { OpenAI } = require('openai');
const getCfdiClient = require('../db/cfdiClient');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Clasifica varios CFDI en un solo request.
 * @param {string[]} descripciones Lista de conceptos de CFDI
 * @returns {Promise<string[]>} Categorías IA en el mismo orden
 */
async function clasificarLoteCfdi(descripciones) {
  // Prepara lista numerada para el prompt
  const lista = descripciones
    .map((d, i) => `${i + 1}. ${d?.toString().replace(/\s+/g, ' ').trim() || ''}`)
    .join('\n');

  const prompt = `
Eres un contador experto especializado en CFDI de agencias automotrices (como Nissan).
Debes clasificar cada concepto en una de las siguientes categorías:

Combustible, Vehículos Nuevos, Refacciones y mantenimiento, 
Servicios profesionales y administrativos, Publicidad y marketing, 
Arrendamiento, Gastos de operación, Servicios de transporte, 
Consumo interno y alimentos, Servicios técnicos y mantenimiento, 
Tecnología y comunicaciones, Intereses y comisiones, 
Anticipos y pagos aplicados, Otro

Reglas:
- Analiza cada concepto con criterio contable.
- Si no hay coincidencia clara, usa "Otro".
- Devuelve la lista de resultados en formato:
  1. Categoría
  2. Categoría
  3. Categoría
  (solo las categorías, en el mismo orden de entrada, sin texto adicional)

Conceptos:
${lista}
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    max_tokens: 200,
  });

  // Divide las líneas en una lista de categorías limpias
  const output = completion.choices[0].message.content
    .split('\n')
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  return output;
}

module.exports = { clasificarLoteCfdi };
