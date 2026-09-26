import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const createWarehouseSchema = z.object({
  name: z.string().min(1, 'Warehouse name is required'),
  shortCode: z
    .string()
    .min(2, 'Short code must be at least 2 characters')
    .max(6, 'Short code must be at most 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Short code must be uppercase alphanumeric'),
  address: z.string().optional()
});

const updateWarehouseSchema = createWarehouseSchema.partial();

// GET /api/warehouses
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const warehouses = await prisma.warehouse.findMany({
    where: { active: true },
    include: {
      _count: {
        select: { locations: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  res.json({ ok: true, data: warehouses });
});

// POST /api/warehouses
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const data = createWarehouseSchema.parse(req.body);

  const existing = await prisma.warehouse.findUnique({
    where: { shortCode: data.shortCode }
  });

  if (existing) {
    res.status(409).json({ error: `Warehouse with short code '${data.shortCode}' already exists.` });
    return;
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      name: data.name,
      shortCode: data.shortCode,
      address: data.address
    }
  });

  // Auto-create a default Stock location for this warehouse if desired
  await prisma.location.create({
    data: {
      name: `${warehouse.name} Stock 1`,
      shortCode: 'Stock1',
      fullPath: `${warehouse.shortCode}/Stock1`,
      type: 'INTERNAL',
      warehouseId: warehouse.id
    }
  });

  res.status(201).json({ ok: true, data: warehouse });
});

// PUT /api/warehouses/:id
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateWarehouseSchema.parse(req.body);

  if (data.shortCode) {
    const existing = await prisma.warehouse.findFirst({
      where: { shortCode: data.shortCode, NOT: { id } }
    });
    if (existing) {
      res.status(409).json({ error: `Warehouse with short code '${data.shortCode}' already exists.` });
      return;
    }
  }

  const warehouse = await prisma.warehouse.update({
    where: { id },
    data
  });

  res.json({ ok: true, data: warehouse });
});

// DELETE /api/warehouses/:id (soft delete)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.warehouse.update({
    where: { id },
    data: { active: false }
  });

  res.json({ ok: true, message: 'Warehouse deactivated successfully' });
});

export default router;
