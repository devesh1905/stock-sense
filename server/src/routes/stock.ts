import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { ensureVirtualLocations } from '../lib/locations.js';

const router = Router();

const inlineAdjustSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  locationId: z.string().min(1, 'Location ID is required'),
  countedQty: z.number().min(0, 'Counted quantity must be non-negative')
});

// GET /api/stock
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

  // Open delivery demand for Free to Use calculation
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
    const remaining = Math.max(0, line.demandQty - line.doneQty);
    reservedByProduct[line.productId] = (reservedByProduct[line.productId] || 0) + remaining;
  }

  const stockRows = products.map((p) => {
    const onHand = p.quants.reduce((sum, q) => sum + q.quantity, 0);
    const reserved = reservedByProduct[p.id] || 0;
    const freeToUse = Math.max(0, onHand - reserved);
    const rule = p.reorderRules[0] || null;

    let stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' = 'IN_STOCK';
    if (onHand <= 0) {
      stockStatus = 'OUT_OF_STOCK';
    } else if (rule && onHand <= rule.minQty) {
      stockStatus = 'LOW_STOCK';
    }

    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      uom: p.uom,
      unitCost: p.unitCost,
      category: p.category?.name || 'Uncategorized',
      categoryId: p.categoryId,
      onHand,
      freeToUse,
      reserved,
      reorderMin: rule?.minQty ?? null,
      reorderMax: rule?.maxQty ?? null,
      stockStatus,
      locations: p.quants.map((q) => ({
        locationId: q.locationId,
        locationName: q.location.name,
        fullPath: q.location.fullPath,
        warehouseName: q.location.warehouse?.name,
        quantity: q.quantity
      }))
    };
  });

  res.json({ ok: true, data: stockRows });
});

// POST /api/stock/adjust-inline
router.post('/adjust-inline', requireAuth, async (req: AuthRequest, res: Response) => {
  const { productId, locationId, countedQty } = inlineAdjustSchema.parse(req.body);

  await ensureVirtualLocations();

  const product = await prisma.product.findUnique({
    where: { id: productId }
  });
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const location = await prisma.location.findUnique({
    where: { id: locationId },
    include: { warehouse: true }
  });
  if (!location) {
    res.status(404).json({ error: 'Location not found' });
    return;
  }

  const adjLocation = await prisma.location.findFirst({
    where: { type: 'ADJUSTMENT' }
  });
  if (!adjLocation) {
    res.status(500).json({ error: 'Virtual adjustment location missing' });
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Current quant
    const currentQuant = await tx.stockQuant.findUnique({
      where: {
        productId_locationId: { productId, locationId }
      }
    });

    const recordedQty = currentQuant?.quantity || 0;
    const diff = countedQty - recordedQty;

    // 2. Upsert quant
    const updatedQuant = await tx.stockQuant.upsert({
      where: {
        productId_locationId: { productId, locationId }
      },
      update: { quantity: countedQty },
      create: {
        productId,
        locationId,
        quantity: countedQty
      }
    });

    // 3. Create adjustment operation & move if there is a difference
    let move = null;
    if (diff !== 0) {
      const whCode = location.warehouse?.shortCode || 'WH';
      const count = await tx.operation.count({ where: { type: 'ADJUSTMENT' } });
      const seq = String(count + 1).padStart(4, '0');
      const reference = `${whCode}/ADJ/${seq}`;

      const operation = await tx.operation.create({
        data: {
          reference,
          type: 'ADJUSTMENT',
          status: 'DONE',
          sourceLocationId: diff < 0 ? location.id : adjLocation.id,
          destLocationId: diff > 0 ? location.id : adjLocation.id,
          validatedAt: new Date(),
          responsibleId: req.user?.id,
          notes: `Inline stock adjustment: ${diff > 0 ? `+${diff}` : diff} units`
        }
      });

      await tx.operationLine.create({
        data: {
          operationId: operation.id,
          productId: product.id,
          demandQty: countedQty,
          doneQty: countedQty,
          countedQty: countedQty
        }
      });

      move = await tx.stockMove.create({
        data: {
          productId: product.id,
          fromLocationId: diff < 0 ? location.id : adjLocation.id,
          toLocationId: diff > 0 ? location.id : adjLocation.id,
          quantity: Math.abs(diff),
          operationId: operation.id,
          userId: req.user?.id
        }
      });
    }

    return {
      recordedQty,
      countedQty,
      diff,
      quant: updatedQuant,
      move
    };
  });

  res.json({
    ok: true,
    message: `Stock updated to ${countedQty}. ${result.diff !== 0 ? `Adjustment move of ${result.diff > 0 ? `+${result.diff}` : result.diff} logged.` : 'No change.'}`,
    data: result
  });
});

export default router;
