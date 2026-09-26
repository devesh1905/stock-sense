import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  let dbHealthy = false;
  let dbError: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbHealthy = true;
  } catch (err: unknown) {
    dbHealthy = false;
    dbError = err instanceof Error ? err.message : 'Unknown database error';
  }

  const status = dbHealthy ? 200 : 503;
  res.status(status).json({
    ok: dbHealthy,
    db: dbHealthy,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    ...(dbError ? { error: dbError } : {})
  });
});

export default router;
