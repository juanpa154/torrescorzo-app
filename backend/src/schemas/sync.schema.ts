import { z } from 'zod';

export const syncEjecutarSchema = z.object({
  schema: z.string().min(1, 'Falta el parámetro schema'),
  tipo: z.enum(['emitidos', 'recibidos']).optional().default('recibidos'),
});

export const syncEstadoSchema = z.object({
  schema: z.string().min(1, 'Falta el parámetro schema'),
});
