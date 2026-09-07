import cron from 'node-cron';
import { sincronizarCfdis } from '../services/cfdiSync.service';
import logger from '../config/logger';
import { env } from '../config/env';

const schemas: string[] = require('../../config/schemas');
const tipos = ['emitidos', 'recibidos'] as const;

export function startCfdiCron(): void {
  const schedule = env.CFDI_CRON_SCHEDULE;

  if (!cron.validate(schedule)) {
    logger.error({ schedule }, 'CFDI_CRON_SCHEDULE inválido — cron no iniciado');
    return;
  }

  cron.schedule(schedule, async () => {
    logger.info('Iniciando sincronización automática de CFDI');

    for (const schema of schemas) {
      for (const tipo of tipos) {
        try {
          const resultado = await sincronizarCfdis(schema, tipo);
          logger.info({ schema, tipo, resultado }, 'Sync CFDI completado');
        } catch (err: any) {
          logger.error({ schema, tipo, err: err.message }, 'Error en sync CFDI');
        }
      }
    }
  });

  logger.info({ schedule }, 'Cron de sincronización CFDI iniciado');
}
