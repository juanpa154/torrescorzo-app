import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const { openai } = require('../../config/openaiClient');
const { clasificarLoteCfdi } = require('../../helpers/cfdiClassifier');

function openAIResponse(lines: string[]) {
  return {
    choices: [{
      message: {
        content: lines.map((l, i) => `${i + 1}. ${l}`).join('\n'),
      },
    }],
  };
}

describe('clasificarLoteCfdi', () => {
  afterEach(() => vi.restoreAllMocks());

  it('clasifica un lote pequeño y devuelve categorías', async () => {
    vi.spyOn(openai.chat.completions, 'create').mockResolvedValue(
      openAIResponse(['Combustible', 'Otro'])
    );
    const result = await clasificarLoteCfdi(['gasolina magna', 'concepto desconocido']);
    expect(result).toEqual(['Combustible', 'Otro']);
    expect(openai.chat.completions.create).toHaveBeenCalledTimes(1);
  });

  it('rellena con "Otro" cuando OpenAI devuelve menos líneas de las esperadas', async () => {
    vi.spyOn(openai.chat.completions, 'create').mockResolvedValue({
      choices: [{ message: { content: '1. Combustible' } }],
    });
    const result = await clasificarLoteCfdi(['gasolina', 'item2', 'item3']);
    expect(result).toHaveLength(3);
    expect(result[0]).toBe('Combustible');
    expect(result[1]).toBe('Otro');
    expect(result[2]).toBe('Otro');
  });

  it('divide en batches de 50 para listas grandes', async () => {
    vi.spyOn(openai.chat.completions, 'create')
      .mockResolvedValueOnce(openAIResponse(Array(50).fill('Otro')))
      .mockResolvedValueOnce(openAIResponse(['Combustible']));
    const result = await clasificarLoteCfdi(Array(51).fill('concepto de prueba'));
    expect(openai.chat.completions.create).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(51);
    expect(result[50]).toBe('Combustible');
  });

  it('trunca al tamaño del batch si OpenAI devuelve más líneas', async () => {
    vi.spyOn(openai.chat.completions, 'create').mockResolvedValue(
      openAIResponse(['Combustible', 'Otro', 'Extra'])
    );
    const result = await clasificarLoteCfdi(['solo uno']);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe('Combustible');
  });

  it('maneja conceptos nulos o vacíos sin lanzar error', async () => {
    vi.spyOn(openai.chat.completions, 'create').mockResolvedValue(
      openAIResponse(['Otro', 'Otro'])
    );
    const result = await clasificarLoteCfdi([null, '']);
    expect(result).toHaveLength(2);
  });
});
