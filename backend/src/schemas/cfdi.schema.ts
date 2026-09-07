import { z } from 'zod';

export const cfdiQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(10000).optional().default(50),
  mes: z.coerce.number().int().min(1).max(12).optional().nullable(),
  anio: z.coerce.number().int().min(2000).max(2100).optional().nullable(),
  tipo: z.string().optional().nullable(),
  rfc: z.string().optional().nullable(),
  minMonto: z.string().optional().nullable(),
  maxMonto: z.string().optional().nullable(),
  categoriaIa: z.string().optional().nullable(),
});

export const dashboardQuerySchema = z.object({
  schema: z.string().min(1, 'Falta el parámetro schema'),
  anio: z.coerce.number().int().min(2000).max(2100).optional(),
});

export const clasificarQuerySchema = z.object({
  schema: z.string().min(1, 'Falta el parámetro schema'),
  tipo: z.enum(['emitidos', 'recibidos']).optional().default('recibidos'),
  limit: z.coerce.number().int().positive().max(5000).optional().default(1000),
});
