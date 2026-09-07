import { Router } from 'express';
import { prisma } from '../db/prismaClient';

const router = Router();

router.get('/', async (_req, res) => {
  let dbStatus: 'ok' | 'error' = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: 'ok',
    version: process.env.npm_package_version ?? '1.0.0',
    uptime: Math.floor(process.uptime()),
    db: dbStatus,
  });
});

export default router;
