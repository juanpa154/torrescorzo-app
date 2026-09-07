import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { prisma } = require('../../db/prismaClient');
const {
  getSiguiente,
  buscarCodigos,
  getCodigo,
  createCodigo,
} = require('../../models/codigos.model');

const SCHEMA = 'nissan_tc';

// ─── getSiguiente ────────────────────────────────────────────────────────────

describe('getSiguiente', () => {
  afterEach(() => vi.restoreAllMocks());

  it('devuelve "00001" cuando no existe registro 99999', async () => {
    vi.spyOn(prisma.codigo, 'findUnique').mockResolvedValue(null);
    const result = await getSiguiente(SCHEMA);
    expect(result).toBe('00001');
  });

  it('devuelve el código del contador cuando no hay colisión', async () => {
    vi.spyOn(prisma.codigo, 'findUnique')
      .mockResolvedValueOnce({ codPos: '00042' }) // registro 99999
      .mockResolvedValueOnce(null);               // código "00042" libre
    const result = await getSiguiente(SCHEMA);
    expect(result).toBe('00042');
  });

  it('avanza al siguiente si hay colisión', async () => {
    vi.spyOn(prisma.codigo, 'findUnique')
      .mockResolvedValueOnce({ codPos: '00010' }) // registro 99999
      .mockResolvedValueOnce({ id: 1 })           // "00010" ocupado
      .mockResolvedValueOnce(null);               // "00011" libre
    const result = await getSiguiente(SCHEMA);
    expect(result).toBe('00011');
  });

  it('formatea con ceros a la izquierda', async () => {
    vi.spyOn(prisma.codigo, 'findUnique')
      .mockResolvedValueOnce({ codPos: '5' })
      .mockResolvedValueOnce(null);
    const result = await getSiguiente(SCHEMA);
    expect(result).toBe('00005');
  });
});

// ─── buscarCodigos ───────────────────────────────────────────────────────────

describe('buscarCodigos', () => {
  afterEach(() => vi.restoreAllMocks());

  it('busca por nombre con LIKE insensible', async () => {
    vi.spyOn(prisma.codigo, 'count').mockResolvedValue(2);
    vi.spyOn(prisma.codigo, 'findMany').mockResolvedValue([
      { codigo: '00001', paterno: 'GARCIA', nombre: 'JUAN', rfc: null },
    ]);

    const result = await buscarCodigos(SCHEMA, { q: 'garcia', tipo: 'nombre', limit: 20, offset: 0 });

    expect(result.total).toBe(2);
    expect(result.rows).toHaveLength(1);

    const call = (prisma.codigo.findMany as any).mock.calls[0][0];
    expect(call.where.OR).toBeDefined();
    expect(call.where.agencySchema).toBe(SCHEMA);
    expect(call.where.NOT).toEqual({ codigo: '99999' });
  });

  it('busca por razón social', async () => {
    vi.spyOn(prisma.codigo, 'count').mockResolvedValue(1);
    vi.spyOn(prisma.codigo, 'findMany').mockResolvedValue([]);

    await buscarCodigos(SCHEMA, { q: 'TORRES', tipo: 'razon', limit: 20, offset: 0 });

    const call = (prisma.codigo.findMany as any).mock.calls[0][0];
    expect(call.where.razSoc).toBeDefined();
    expect(call.where.razSoc.contains).toBe('TORRES');
  });

  it('busca por RFC en mayúsculas', async () => {
    vi.spyOn(prisma.codigo, 'count').mockResolvedValue(0);
    vi.spyOn(prisma.codigo, 'findMany').mockResolvedValue([]);

    await buscarCodigos(SCHEMA, { q: 'gajj', tipo: 'rfc', limit: 20, offset: 0 });

    const call = (prisma.codigo.findMany as any).mock.calls[0][0];
    expect(call.where.rfc.contains).toBe('GAJJ');
  });

  it('respeta limit y offset', async () => {
    vi.spyOn(prisma.codigo, 'count').mockResolvedValue(100);
    vi.spyOn(prisma.codigo, 'findMany').mockResolvedValue([]);

    await buscarCodigos(SCHEMA, { q: 'test', tipo: 'nombre', limit: 10, offset: 30 });

    const call = (prisma.codigo.findMany as any).mock.calls[0][0];
    expect(call.take).toBe(10);
    expect(call.skip).toBe(30);
  });
});

// ─── getCodigo ────────────────────────────────────────────────────────────────

describe('getCodigo', () => {
  afterEach(() => vi.restoreAllMocks());

  it('busca por agencySchema + codigo', async () => {
    const mock = { id: 1, codigo: '00001', nombre: 'JUAN' };
    vi.spyOn(prisma.codigo, 'findUnique').mockResolvedValue(mock);

    const result = await getCodigo(SCHEMA, '00001');
    expect(result).toEqual(mock);

    const call = (prisma.codigo.findUnique as any).mock.calls[0][0];
    expect(call.where).toEqual({ agencySchema_codigo: { agencySchema: SCHEMA, codigo: '00001' } });
  });

  it('devuelve null si no existe', async () => {
    vi.spyOn(prisma.codigo, 'findUnique').mockResolvedValue(null);
    const result = await getCodigo(SCHEMA, '99998');
    expect(result).toBeNull();
  });
});

// ─── createCodigo ─────────────────────────────────────────────────────────────

describe('createCodigo', () => {
  afterEach(() => vi.restoreAllMocks());

  it('crea el código y actualiza el contador 99999 en transacción', async () => {
    const mockCreated = { id: 1, codigo: '00042', agencySchema: SCHEMA };
    vi.spyOn(prisma, '$transaction').mockImplementation(async (fn: Function) => {
      const tx = {
        codigo: {
          create: vi.fn().mockResolvedValue(mockCreated),
          upsert: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });

    const result = await createCodigo(SCHEMA, '00042', { nombre: 'JUAN' });

    expect(result).toEqual(mockCreated);

    // Verificar que la transacción fue llamada
    expect((prisma.$transaction as any).mock.calls).toHaveLength(1);
  });
});
