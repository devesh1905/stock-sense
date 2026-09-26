import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional()
});

// GET /api/categories
router.get('/', requireAuth, async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({ ok: true, data: categories });
});

// POST /api/categories
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const data = categorySchema.parse(req.body);

  const existing = await prisma.category.findUnique({
    where: { name: data.name }
  });

  if (existing) {
    res.status(409).json({ error: `Category '${data.name}' already exists.` });
    return;
  }

  const category = await prisma.category.create({
    data
  });

  res.status(201).json({ ok: true, data: category });
});

// PUT /api/categories/:id
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = categorySchema.partial().parse(req.body);

  if (data.name) {
    const existing = await prisma.category.findFirst({
      where: { name: data.name, NOT: { id } }
    });
    if (existing) {
      res.status(409).json({ error: `Category '${data.name}' already exists.` });
      return;
    }
  }

  const category = await prisma.category.update({
    where: { id },
    data
  });

  res.json({ ok: true, data: category });
});

// DELETE /api/categories/:id
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.category.delete({
    where: { id }
  });

  res.json({ ok: true, message: 'Category deleted successfully' });
});

export default router;
