import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { getVirtualLocation } from '../lib/locations.js';
import {
  generateOperationReference,
  validateOperation,
  calculateStockAvailability,
  verifyStockConsistency
} from '../services/stockEngine.js';
import { OperationType, OperationStatus } from '@prisma/client';

const router = Router();

const createOperationSchema = z.object({
  type: z.enum(['RECEIPT', 'DELIVERY', 'INTERNAL', 'ADJUSTMENT']),
  contact: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  scheduledDate: z.string().optional().nullable(),
  sourceLocationId: z.string().optional().nullable(),
  destLocationId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product is required'),
        demandQty: z.number().min(0, 'Quantity must be non-negative'),
        countedQty: z.number().optional().nullable()
      })
    )
    .min(1, 'At least one product line is required')
});

const updateOperationSchema = z.object({
  contact: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  scheduledDate: z.string().optional().nullable(),
  sourceLocationId: z.string().optional().nullable(),
  destLocationId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  pickedAt: z.string().optional().nullable(),
  packedAt: z.string().optional().nullable(),
  lines: z
    .array(
      z.object({
        id: z.string().optional(),
        productId: z.string().min(1, 'Product is required'),
        demandQty: z.number().min(0, 'Quantity must be non-negative'),
        countedQty: z.number().optional().nullable()
      })
    )
    .optional()
});

/**
 * GET /api/operations
 * Query params: type, status, search, warehouseId
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  const { type, status, search, warehouseId } = req.query;

  const where: any = {};

  if (type) {
    where.type = type as OperationType;
  }

  if (status) {
    where.status = status as OperationStatus;
  }

  if (search) {
    const s = String(search).trim();
    where.OR = [
      { reference: { contains: s, mode: 'insensitive' } },
      { contact: { contains: s, mode: 'insensitive' } }
    ];
  }

  if (warehouseId) {
    where.OR = [
      { sourceLocation: { warehouseId: String(warehouseId) } },
      { destLocation: { warehouseId: String(warehouseId) } }
    ];
  }

  const operations = await prisma.operation.findMany({
    where,
    include: {
      sourceLocation: {
        select: { id: true, name: true, shortCode: true, fullPath: true, warehouseId: true }
      },
      destLocation: {
        select: { id: true, name: true, shortCode: true, fullPath: true, warehouseId: true }
      },
      responsible: {
        select: { id: true, name: true, loginId: true }
      },
      lines: {
        include: {
          product: {
            select: { id: true, name: true, sku: true, uom: true, unitCost: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate late status dynamically (scheduledDate < today and not DONE/CANCELED)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatted = operations.map((op) => {
    const isLate =
      op.scheduledDate &&
      new Date(op.scheduledDate) < today &&
      op.status !== 'DONE' &&
      op.status !== 'CANCELED';

    const totalQty = op.lines.reduce((sum, line) => sum + line.demandQty, 0);

    return {
      ...op,
      isLate: Boolean(isLate),
      totalLines: op.lines.length,
      totalQty
    };
  });

  res.json({ ok: true, data: formatted });
});

/**
 * GET /api/operations/consistency
 * Verify that StockQuants match the sum of immutable ledger StockMoves
 */
router.get('/consistency', requireAuth, async (_req: Request, res: Response) => {
  const result = await verifyStockConsistency();
  res.json({ ok: true, data: result });
});

/**
 * GET /api/operations/:id
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  const { id } = req.params;

  const operation = await prisma.operation.findUnique({
    where: { id },
    include: {
      sourceLocation: {
        include: { warehouse: true }
      },
      destLocation: {
        include: { warehouse: true }
      },
      responsible: {
        select: { id: true, name: true, loginId: true, role: true }
      },
      lines: {
        include: {
          product: true
        }
      },
      moves: {
        include: {
          product: true,
          fromLocation: true,
          toLocation: true,
          user: { select: { id: true, name: true, loginId: true } }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!operation) {
    throw new AppError('Operation not found', 404);
  }

  // Check shortages if delivery
  let lineAvailability: Array<{ productId: string; onHand: number; freeToUse: number; isShort: boolean }> = [];
  if (operation.type === 'DELIVERY' && operation.sourceLocationId) {
    for (const line of operation.lines) {
      const avail = await calculateStockAvailability(line.productId, operation.sourceLocationId);
      lineAvailability.push({
        productId: line.productId,
        onHand: avail.onHand,
        freeToUse: avail.freeToUse,
        isShort: avail.freeToUse < line.demandQty
      });
    }
  }

  res.json({
    ok: true,
    data: {
      ...operation,
      lineAvailability
    }
  });
});

/**
 * POST /api/operations
 * Create a new operation (Draft)
 */
router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const data = createOperationSchema.parse(req.body);

  let sourceLocId = data.sourceLocationId;
  let destLocId = data.destLocationId;

  // Resolve default virtual locations if omitted
  if (data.type === 'RECEIPT' && !sourceLocId) {
    const vendorLoc = await getVirtualLocation('VENDOR');
    sourceLocId = vendorLoc.id;
  } else if (data.type === 'DELIVERY' && !destLocId) {
    const customerLoc = await getVirtualLocation('CUSTOMER');
    destLocId = customerLoc.id;
  }

  if (!sourceLocId || !destLocId) {
    throw new AppError('Source and destination locations are required.', 400);
  }

  // Generate standardized sequence reference: e.g. WH/IN/0001
  const refLocationId = data.type === 'RECEIPT' ? destLocId : sourceLocId;
  const reference = await generateOperationReference(data.type, refLocationId);

  const operation = await prisma.operation.create({
    data: {
      reference,
      type: data.type,
      status: 'DRAFT',
      contact: data.contact || null,
      deliveryAddress: data.deliveryAddress || null,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : new Date(),
      sourceLocationId: sourceLocId,
      destLocationId: destLocId,
      responsibleId: req.user!.id,
      notes: data.notes || null,
      lines: {
        create: data.lines.map((line) => ({
          productId: line.productId,
          demandQty: line.demandQty,
          countedQty: line.countedQty ?? null
        }))
      }
    },
    include: {
      lines: {
        include: { product: true }
      },
      sourceLocation: true,
      destLocation: true,
      responsible: {
        select: { id: true, name: true, loginId: true }
      }
    }
  });

  res.status(201).json({ ok: true, data: operation });
});

/**
 * PUT /api/operations/:id
 * Update draft operation
 */
router.put('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const data = updateOperationSchema.parse(req.body);

  const existing = await prisma.operation.findUnique({
    where: { id },
    include: { lines: true }
  });

  if (!existing) {
    throw new AppError('Operation not found', 404);
  }

  if (existing.status === 'DONE') {
    throw new AppError('Validated documents cannot be modified. Create an adjustment instead.', 400);
  }

  if (existing.status === 'CANCELED') {
    throw new AppError('Canceled documents cannot be modified.', 400);
  }

  const updateData: any = {};
  if (data.contact !== undefined) updateData.contact = data.contact;
  if (data.deliveryAddress !== undefined) updateData.deliveryAddress = data.deliveryAddress;
  if (data.scheduledDate !== undefined) {
    updateData.scheduledDate = data.scheduledDate ? new Date(data.scheduledDate) : null;
  }
  if (data.sourceLocationId !== undefined) updateData.sourceLocationId = data.sourceLocationId;
  if (data.destLocationId !== undefined) updateData.destLocationId = data.destLocationId;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.pickedAt !== undefined) updateData.pickedAt = data.pickedAt ? new Date(data.pickedAt) : null;
  if (data.packedAt !== undefined) updateData.packedAt = data.packedAt ? new Date(data.packedAt) : null;

  // Transaction to update lines if provided
  const updated = await prisma.$transaction(async (tx) => {
    if (data.lines) {
      // Delete existing lines
      await tx.operationLine.deleteMany({
        where: { operationId: id }
      });
      // Re-create lines
      await tx.operationLine.createMany({
        data: data.lines.map((l) => ({
          operationId: id,
          productId: l.productId,
          demandQty: l.demandQty,
          countedQty: l.countedQty ?? null
        }))
      });
    }

    return await tx.operation.update({
      where: { id },
      data: updateData,
      include: {
        lines: { include: { product: true } },
        sourceLocation: true,
        destLocation: true,
        responsible: { select: { id: true, name: true, loginId: true } }
      }
    });
  });

  res.json({ ok: true, data: updated });
});

/**
 * POST /api/operations/:id/to-do
 * Mark DRAFT -> READY (or WAITING for delivery if stock short)
 */
router.post('/:id/to-do', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const operation = await prisma.operation.findUnique({
    where: { id },
    include: {
      lines: { include: { product: true } },
      sourceLocation: true
    }
  });

  if (!operation) {
    throw new AppError('Operation not found', 404);
  }

  if (operation.status !== 'DRAFT') {
    throw new AppError(`Only DRAFT operations can be marked To Do. Current: ${operation.status}`, 400);
  }

  // Delivery shortage verification
  let nextStatus: OperationStatus = 'READY';
  let shortages: Array<{ product: string; sku: string; demand: number; onHand: number; freeToUse: number }> = [];

  if (operation.type === 'DELIVERY' && operation.sourceLocationId) {
    for (const line of operation.lines) {
      const avail = await calculateStockAvailability(line.productId, operation.sourceLocationId);
      if (avail.onHand < line.demandQty) {
        nextStatus = 'WAITING';
        shortages.push({
          product: line.product.name,
          sku: line.product.sku,
          demand: line.demandQty,
          onHand: avail.onHand,
          freeToUse: avail.freeToUse
        });
      }
    }
  }

  const updated = await prisma.operation.update({
    where: { id },
    data: { status: nextStatus },
    include: {
      lines: { include: { product: true } },
      sourceLocation: true,
      destLocation: true
    }
  });

  res.json({
    ok: true,
    data: updated,
    isWaiting: nextStatus === 'WAITING',
    shortages,
    message:
      nextStatus === 'WAITING'
        ? `${shortages.length} product(s) are short at source location. Delivery set to Waiting.`
        : `Operation marked Ready.`
  });
});

/**
 * POST /api/operations/:id/validate
 * Atomic validation & stock movement execution
 */
router.post('/:id/validate', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const result = await validateOperation(id, req.user!.id);
  res.json({ ok: true, data: result });
});

/**
 * POST /api/operations/:id/cancel
 * Cancel operation
 */
router.post('/:id/cancel', requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const operation = await prisma.operation.findUnique({ where: { id } });
  if (!operation) {
    throw new AppError('Operation not found', 404);
  }

  if (operation.status === 'DONE') {
    throw new AppError('Validated operations cannot be canceled.', 400);
  }

  const updated = await prisma.operation.update({
    where: { id },
    data: { status: 'CANCELED' }
  });

  res.json({ ok: true, data: updated, message: `Operation ${updated.reference} canceled.` });
});

export default router;
