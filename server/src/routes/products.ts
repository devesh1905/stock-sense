import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { ensureVirtualLocations } from '../lib/locations.js';

const router = Router();

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z
    .string()
    .min(2, 'SKU must be at least 2 characters')
    .max(20, 'SKU must be at most 20 characters')
    .regex(/^[A-Za-z0-9_-]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  categoryId: z.string().optional().nullable(),
  uom: z.string().default('Units'),
  unitCost: z.number().min(0, 'Unit cost must be non-negative').default(0),
  initialStock: z.number().min(0).optional(),
  initialLocationId: z.string().optional()
});

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().optional().nullable(),
  uom: z.string().optional(),
  unitCost: z.number().min(0).optional()
});

const reorderRuleSchema = z.object({
  minQty: z.number().min(0, 'Min quantity must be non-negative'),
  maxQty: z.number().min(0, 'Max quantity must be non-negative'),
  locationId: z.string().optional().nullable()
});

// GET /api/products
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { search, categoryId } = req.query;

  const whereClause: Record<string, unknown> = { active: true };

  if (categoryId) {
    whereClause.categoryId = String(categoryId);
  }

  if (search) {
    const s = String(search).trim();
    whereClause.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { sku: { contains: s, mode: 'insensitive' } }
    ];
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      category: { select: { id: true, name: true } },
      quants: {
        include: {
          location: {
            select: { id: true, name: true, fullPath: true, warehouse: { select: { name: true, shortCode: true } } }
          }
        }
      },
      reorderRules: true
    },
    orderBy: { name: 'asc' }
  });

  // Calculate free-to-use math: On Hand - Demand of open (WAITING / READY) Delivery lines
  const openDeliveryLines = await prisma.operationLine.findMany({
    where: {
      operation: {
        type: 'DELIVERY',
        status: { in: ['WAITING', 'READY'] }
      }
    },
    select: {
      productId: true,
      demandQty: true,
      doneQty: true
    }
  });

  const reservedByProduct: Record<string, number> = {};
  for (const line of openDeliveryLines) {
    const remainingDemand = Math.max(0, line.demandQty - line.doneQty);
    reservedByProduct[line.productId] = (reservedByProduct[line.productId] || 0) + remainingDemand;
  }

  const items = products.map((p) => {
    const onHand = p.quants.reduce((sum, q) => sum + q.quantity, 0);
    const reserved = reservedByProduct[p.id] || 0;
    const freeToUse = Math.max(0, onHand - reserved);
    const reorderRule = p.reorderRules[0] || null;

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      uom: p.uom,
      unitCost: p.unitCost,
      category: p.category,
      categoryId: p.categoryId,
      onHand,
      freeToUse,
      reserved,
      reorderRule,
      locations: p.quants.map((q) => ({
        locationId: q.locationId,
        locationName: q.location.name,
        fullPath: q.location.fullPath,
        warehouseName: q.location.warehouse?.name,
        quantity: q.quantity
      }))
    };
  });

  res.json({ ok: true, data: items });
});

// GET /api/products/:id
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      quants: {
        include: {
          location: {
            include: { warehouse: true }
          }
        },
        orderBy: { location: { fullPath: 'asc' } }
      },
      reorderRules: {
        include: { location: true }
      }
    }
  });

  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  // Calculate reserved quantity
  const openDeliveryLines = await prisma.operationLine.findMany({
    where: {
      productId: id,
      operation: {
        type: 'DELIVERY',
        status: { in: ['WAITING', 'READY'] }
      }
    }
  });

  const reserved = openDeliveryLines.reduce(
    (sum, line) => sum + Math.max(0, line.demandQty - line.doneQty),
    0
  );
  const onHand = product.quants.reduce((sum, q) => sum + q.quantity, 0);
  const freeToUse = Math.max(0, onHand - reserved);

  res.json({
    ok: true,
    data: {
      ...product,
      onHand,
      freeToUse,
      reserved
    }
  });
});

// POST /api/products
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const data = createProductSchema.parse(req.body);
  const formattedSku = data.sku.toUpperCase();

  const existing = await prisma.product.findUnique({
    where: { sku: formattedSku }
  });

  if (existing) {
    res.status(409).json({ error: `Product with SKU '${formattedSku}' already exists.` });
    return;
  }

  await ensureVirtualLocations();

  const createdProduct = await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: data.name,
        sku: formattedSku,
        categoryId: data.categoryId || null,
        uom: data.uom || 'Units',
        unitCost: data.unitCost || 0
      },
      include: { category: true }
    });

    // Handle optional initial stock
    if (data.initialStock && data.initialStock > 0 && data.initialLocationId) {
      await tx.stockQuant.create({
        data: {
          productId: product.id,
          locationId: data.initialLocationId,
          quantity: data.initialStock
        }
      });

      // Post initial adjustment ledger entry
      const adjLocation = await tx.location.findFirst({
        where: { type: 'ADJUSTMENT' }
      });

      if (adjLocation) {
        await tx.stockMove.create({
          data: {
            productId: product.id,
            fromLocationId: adjLocation.id,
            toLocationId: data.initialLocationId,
            quantity: data.initialStock,
            userId: req.user?.id
          }
        });
      }
    }

    return product;
  });

  res.status(201).json({ ok: true, data: createdProduct });
});

// PUT /api/products/:id
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = updateProductSchema.parse(req.body);

  const product = await prisma.product.update({
    where: { id },
    data,
    include: { category: true }
  });

  res.json({ ok: true, data: product });
});

// DELETE /api/products/:id (soft delete)
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.product.update({
    where: { id },
    data: { active: false }
  });

  res.json({ ok: true, message: 'Product deactivated successfully' });
});

// POST /api/products/:id/reorder-rule
router.post('/:id/reorder-rule', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = reorderRuleSchema.parse(req.body);

  if (data.minQty > data.maxQty) {
    res.status(400).json({ error: 'Min quantity cannot exceed Max quantity.' });
    return;
  }

  // Find existing rule or create
  const existing = await prisma.reorderRule.findFirst({
    where: {
      productId: id,
      locationId: data.locationId || null
    }
  });

  let rule;
  if (existing) {
    rule = await prisma.reorderRule.update({
      where: { id: existing.id },
      data: {
        minQty: data.minQty,
        maxQty: data.maxQty
      }
    });
  } else {
    rule = await prisma.reorderRule.create({
      data: {
        productId: id,
        locationId: data.locationId || null,
        minQty: data.minQty,
        maxQty: data.maxQty
      }
    });
  }

  res.json({ ok: true, data: rule });
});

// DELETE /api/products/reorder-rules/:ruleId
router.delete('/reorder-rules/:ruleId', requireAuth, async (req: Request, res: Response) => {
  const { ruleId } = req.params;

  await prisma.reorderRule.delete({
    where: { id: ruleId }
  });

  res.json({ ok: true, message: 'Reorder rule removed successfully' });
});

export default router;
