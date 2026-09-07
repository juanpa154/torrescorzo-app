import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';

// createRequire hace que require() use el module cache nativo de Node.js
// (el mismo que usa el service CJS) en lugar del registry de Vitest
const require = createRequire(import.meta.url);

const { prisma } = require('../../db/prismaClient');
const getCfdiPool = require('../../db/cfdiPool');
const { sincronizarCfdis } = require('../../services/cfdiSync.service');

const pool = getCfdiPool();

describe('sincronizarCfdis', () => {
  beforeEach(() => {
    vi.spyOn(prisma.syncEstado, 'findUnique').mockResolvedValue(null);
    vi.spyOn(prisma.syncEstado, 'upsert').mockResolvedValue({});
    vi.spyOn(prisma.syncEstado, 'update').mockResolvedValue({});
    // Retorna [] sin ejecutar los PrismaPromises del batch
    vi.spyOn(prisma, '$transaction').mockResolvedValue([]);
    vi.spyOn(pool, 'query').mockResolvedValue({ rows: [] });
  });

  afterEach(() => vi.restoreAllMocks());

  it('lanza error con tipo inválido', async () => {
    await expect(sincronizarCfdis('kia_zacatecas', 'invalido')).rejects.toThrow('Tipo inválido: invalido');
  });

  it('sync full cuando no hay ultimaSync — query sin filtro de fecha', async () => {
    const result = await sincronizarCfdis('kia_zacatecas', 'recibidos');
    expect(result).toEqual({ sincronizados: 0 });
    const [query] = (pool.query as any).mock.calls[0];
    expect(query).not.toContain('fecha_emision >=');
  });

  it('sync incremental cuando hay ultimaSync — query con filtro de fecha', async () => {
    vi.spyOn(prisma.syncEstado, 'findUnique').mockResolvedValue({ ultimaSync: new Date('2025-06-01') });
    await sincronizarCfdis('kia_zacatecas', 'recibidos');
    const [query] = (pool.query as any).mock.calls[0];
    expect(query).toContain('fecha_emision >=');
  });

  it('sincroniza registros en batches de 50 y retorna el conteo', async () => {
    const rows = Array.from({ length: 60 }, (_, i) => ({ uuid: `uuid-${i}`, fecha_emision: new Date() }));
    vi.spyOn(pool, 'query').mockResolvedValue({ rows });
    const result = await sincronizarCfdis('kia_zacatecas', 'recibidos');
    expect(result.sincronizados).toBe(60);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it('omite registros sin uuid', async () => {
    vi.spyOn(pool, 'query').mockResolvedValue({ rows: [{ uuid: null }, { uuid: 'valid-uuid' }] });
    const result = await sincronizarCfdis('kia_zacatecas', 'emitidos');
    expect(result.sincronizados).toBe(1);
  });

  it('marca enProgreso: false al lanzar error y relanza la excepción', async () => {
    vi.spyOn(pool, 'query').mockRejectedValue(new Error('fallo de BD'));
    await expect(sincronizarCfdis('kia_zacatecas', 'recibidos')).rejects.toThrow('fallo de BD');
    expect(prisma.syncEstado.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ enProgreso: false }) })
    );
  });
});
