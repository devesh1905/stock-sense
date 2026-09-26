import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { Prisma, OperationType, LocationType } from '@prisma/client';

const router = Router();

// GET /api/moves - list stock moves ledger with pagination and filters
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
    const skip = (page - 1) * limit;

    const {
      search,
      type,
      productId,
      warehouseId,
      locationId,
      dateFrom,
      dateTo,
      direction
    } = req.query;

    const where: Prisma.StockMoveWhereInput = {};

    // Specific product filter
    if (productId && typeof productId === 'string') {
      where.productId = productId;
    }

    // Warehouse filter (from or to location's warehouse)
    if (warehouseId && typeof warehouseId === 'string') {
      where.OR = [
        { fromLocation: { warehouseId } },
        { toLocation: { warehouseId } }
      ];
    }

    // Location filter (from or to location)
    if (locationId && typeof locationId === 'string') {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId }
      ];
    }

    // Operation type filter (RECEIPT, DELIVERY, INTERNAL, ADJUSTMENT)
    if (type && typeof type === 'string' && type !== 'ALL') {
      where.operation = {
        type: type as OperationType
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom && typeof dateFrom === 'string') {
        where.createdAt.gte = new Date(dateFrom);
      }
      if (dateTo && typeof dateTo === 'string') {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    // Search filter across reference, contact, SKU, product name
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      const searchConditions: Prisma.StockMoveWhereInput[] = [
        { operation: { reference: { contains: q, mode: 'insensitive' } } },
        { operation: { contact: { contains: q, mode: 'insensitive' } } },
        { product: { sku: { contains: q, mode: 'insensitive' } } },
        { product: { name: { contains: q, mode: 'insensitive' } } }
      ];

      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions }
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    // Fetch total and records in parallel
    const [total, rawMoves] = await Promise.all([
      prisma.stockMove.count({ where }),
      prisma.stockMove.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              uom: true,
              unitCost: true,
              category: { select: { id: true, name: true } }
            }
          },
          fromLocation: {
            select: {
              id: true,
              name: true,
              shortCode: true,
              fullPath: true,
              type: true,
              warehouse: { select: { id: true, name: true, shortCode: true } }
            }
          },
          toLocation: {
            select: {
              id: true,
              name: true,
              shortCode: true,
              fullPath: true,
              type: true,
              warehouse: { select: { id: true, name: true, shortCode: true } }
            }
          },
          operation: {
            select: {
              id: true,
              reference: true,
              type: true,
              status: true,
              contact: true,
              scheduledDate: true,
              validatedAt: true,
              responsible: { select: { id: true, name: true, loginId: true } }
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              loginId: true
            }
          }
        }
      })
    ]);

    // Format moves with helper classification for direction and signed quantity
    const formattedMoves = rawMoves.map((m) => {
      let moveDirection: 'IN' | 'OUT' | 'INTERNAL' | 'ADJUSTMENT' = 'INTERNAL';
      let signedQty = m.quantity;

      if (m.operation?.type === OperationType.RECEIPT || m.fromLocation.type === LocationType.VENDOR) {
        moveDirection = 'IN';
        signedQty = Math.abs(m.quantity);
      } else if (m.operation?.type === OperationType.DELIVERY || m.toLocation.type === LocationType.CUSTOMER) {
        moveDirection = 'OUT';
        signedQty = -Math.abs(m.quantity);
      } else if (
        m.operation?.type === OperationType.ADJUSTMENT ||
        m.fromLocation.type === LocationType.ADJUSTMENT ||
        m.toLocation.type === LocationType.ADJUSTMENT
      ) {
        moveDirection = 'ADJUSTMENT';
        if (m.fromLocation.type === LocationType.ADJUSTMENT) {
          // Gained stock: virtual adjustment -> internal location
          signedQty = Math.abs(m.quantity);
        } else {
          // Lost stock: internal location -> virtual adjustment
          signedQty = -Math.abs(m.quantity);
        }
      } else {
        moveDirection = 'INTERNAL';
        signedQty = m.quantity;
      }

      return {
        ...m,
        direction: moveDirection,
        signedQuantity: signedQty
      };
    });

    // Optional filter by direction if requested
    const filteredMoves = direction && typeof direction === 'string' && direction !== 'ALL'
      ? formattedMoves.filter(m => m.direction === direction)
      : formattedMoves;

    res.json({
      moves: filteredMoves,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/moves/summary - get overall ledger movement stats
router.get('/summary', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { warehouseId, productId } = req.query;

    const where: Prisma.StockMoveWhereInput = {};
    if (productId && typeof productId === 'string') {
      where.productId = productId;
    }
    if (warehouseId && typeof warehouseId === 'string') {
      where.OR = [
        { fromLocation: { warehouseId } },
        { toLocation: { warehouseId } }
      ];
    }

    const moves = await prisma.stockMove.findMany({
      where,
      select: {
        quantity: true,
        fromLocation: { select: { type: true } },
        toLocation: { select: { type: true } },
        operation: { select: { type: true } }
      }
    });

    let totalIn = 0;
    let totalOut = 0;
    let totalInternal = 0;
    let totalAdjustment = 0;

    for (const m of moves) {
      if (m.operation?.type === OperationType.RECEIPT || m.fromLocation.type === LocationType.VENDOR) {
        totalIn += m.quantity;
      } else if (m.operation?.type === OperationType.DELIVERY || m.toLocation.type === LocationType.CUSTOMER) {
        totalOut += m.quantity;
      } else if (
        m.operation?.type === OperationType.ADJUSTMENT ||
        m.fromLocation.type === LocationType.ADJUSTMENT ||
        m.toLocation.type === LocationType.ADJUSTMENT
      ) {
        totalAdjustment += m.quantity;
      } else {
        totalInternal += m.quantity;
      }
    }

    res.json({
      totalMoves: moves.length,
      totalIn,
      totalOut,
      totalInternal,
      totalAdjustment,
      netChange: totalIn - totalOut
    });
  } catch (error) {
    next(error);
  }
});

export default router;
