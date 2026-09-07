import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL requerido'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  PORT: z.string().optional().default('3000'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY requerido'),
  // BD remota vencimientos
  TU_HOST_REMOTO: z.string().min(1, 'TU_HOST_REMOTO requerido'),
  TU_USUARIO: z.string().min(1, 'TU_USUARIO requerido'),
  TU_PASSWORD: z.string().min(1, 'TU_PASSWORD requerido'),
  NOMBRE_DE_LA_BD: z.string().min(1, 'NOMBRE_DE_LA_BD requerido'),
  // BD CFDI
  PG_CFDI_HOST: z.string().min(1, 'PG_CFDI_HOST requerido'),
  PG_CFDI_PORT: z.string().optional().default('5432'),
  PG_CFDI_USER: z.string().min(1, 'PG_CFDI_USER requerido'),
  PG_CFDI_PASSWORD: z.string().min(1, 'PG_CFDI_PASSWORD requerido'),
  PG_CFDI_DB: z.string().min(1, 'PG_CFDI_DB requerido'),
  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).optional().default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  // CORS: lista de orígenes permitidos separados por coma (ej. https://siia-cloud.vercel.app)
  CORS_ORIGIN: z.string().optional(),
  // Cron
  CFDI_CRON_SCHEDULE: z.string().optional().default('0 2 * * *'),
  CFDI_CRON_ENABLED: z.enum(['true', 'false']).optional().default('true'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas o faltantes:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = parsed.data;
