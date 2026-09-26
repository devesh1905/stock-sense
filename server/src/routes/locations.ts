import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { ensureVirtualLocations } from '../lib/locations.js';

const router = Router();

const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  shortCode: z.string().min(1, 'Short code is required'),
  warehouseId: z.string().optional(),
  type: z.enum(['INTERNAL', 'VENDOR', 'CUSTOMER', 'ADJUSTMENT']).default('INTERNAL')
});

const updateLocationSchema = createLocationSchema.partial();

// GET /api/locations
router.get('/', requireAuth, async (req: Request, res: Response) => {
  await ensureVirtualLocations();

  const { warehouseId, type } = req.query;

  const whereClause: Record<string, unknown> = { active: true };
  if (warehouseId) whereClause.warehouseId = String(warehouseId);
  if (type) whereClause.type = String(type);

  const locations = await prisma.location.findMany({
    where: whereClause,
    include: {
      warehouse: {
        select: { id: true, name: true, shortCode: true }
      },
      _count: {
        select: { quants: true }
      }
    },
    orderBy: [
      { type: 'asc' },
      { fullPath: 'asc' }
    ]
  });

  res.json({ ok: true, data: locations });
});

// POST /api/locations
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const data = createLocationSchema.parse(req.body);

  let fullPath = data.shortCode;

  if (data.warehouseId) {
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId }
    });
    if (!warehouse) {
      res.status(404).json({ error: 'Warehouse not found' });
      return;
    }
    fullPath = `${warehouse.shortCode}/${data.shortCode}`;
  } else if (data.type === 'INTERNAL') {
    res.status(400).json({ error: 'Internal locations must belong to a warehouse' });
    return;
  }

  const location = await prisma.location.create({
    data: {
      name: data.name,
      shortCode: data.shortCode,
      fullPath,
      type: data.type,
      warehouseId: data.warehouseId
    },
    include: {
      warehouse: true
    }
  });

  res.status(201).json({ ok: true, data: location });
});

// PUT /api/locations/:id
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateLocationSchema.parse(req.body);

  const existing = await prisma.location.findUnique({
    where: { id },
    include: { warehouse: true }
  });

  if (!existing) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }

  let fullPath = existing.fullPath;
  if (data.shortCode || data.warehouseId) {
    const whId = data.warehouseId || existing.warehouseId;
    const shortCode = data.shortCode || existing.shortCode;
    if (whId) {
      const wh = await prisma.warehouse.findUnique({ where: { id: whId } });
      if (wh) fullPath = `${wh.shortCode}/${shortCode}`;
    } else {
      fullPath = shortCode;
    }
  }

  const updated = await prisma.location.update({
    where: { id },
    data: {
      ...data,
      fullPath
    },
    include: { warehouse: true }
  });

  res.json({ ok: true, data: updated });
});

// DELETE /api/locations/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  const loc = await prisma.location.findUnique({ where: { id } });
  if (loc && loc.warehouseId === null && loc.type !== 'INTERNAL') {
    res.status(400).json({ error: 'System virtual locations cannot be deleted' });
    return;
  }

  await prisma.location.update({
    where: { id },
    data: { active: false }
  });

  res.json({ ok: true, message: 'Location deactivated successfully' });
});

export default router;
