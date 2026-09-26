import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { OperationType, OperationStatus, LocationType, Prisma } from '@prisma/client';

const router = Router();

// GET /api/dashboard - main inventory dashboard stats, cards, KPIs, alerts, and filtered snapshot
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const {
      type,
      status,
      warehouseId,
      categoryId
    } = req.query;

    // 1. Receipt Card metrics
    const [receiptsToReceive, receiptsLate, receiptsScheduled] = await Promise.all([
      // To receive = active non-done, non-canceled receipts
      prisma.operation.count({
        where: {
          type: OperationType.RECEIPT,
          status: { in: [OperationStatus.DRAFT, OperationStatus.READY] }
        }
      }),
      // Late receipts: scheduled before today and not done/canceled
      prisma.operation.count({
        where: {
          type: OperationType.RECEIPT,
          status: { in: [OperationStatus.DRAFT, OperationStatus.READY] },
          scheduledDate: { lt: todayStart }
        }
      }),
      // Operations scheduled today or later
      prisma.operation.count({
        where: {
          type: OperationType.RECEIPT,
          status: { in: [OperationStatus.DRAFT, OperationStatus.READY] },
          scheduledDate: { gte: todayStart }
        }
      })
    ]);

    // 2. Delivery Card metrics
    const [deliveriesToDeliver, deliveriesLate, deliveriesWaiting, deliveriesScheduled] = await Promise.all([
      // To deliver = active deliveries
      prisma.operation.count({
        where: {
          type: OperationType.DELIVERY,
          status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] }
        }
      }),
      // Late deliveries
      prisma.operation.count({
        where: {
          type: OperationType.DELIVERY,
          status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
          scheduledDate: { lt: todayStart }
        }
      }),
      // Deliveries waiting for stock
      prisma.operation.count({
        where: {
          type: OperationType.DELIVERY,
          status: OperationStatus.WAITING
        }
      }),
      // Operations scheduled today or future
      prisma.operation.count({
        where: {
          type: OperationType.DELIVERY,
          status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] },
          scheduledDate: { gte: todayStart }
        }
      })
    ]);

    // 3. PS KPIs & Stock Calculation
    // Retrieve all products with their internal quants and reorder rules
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        uom: true,
        unitCost: true,
        category: { select: { id: true, name: true } },
        reorderRules: {
          select: { minQty: true, maxQty: true }
        },
        quants: {
          where: {
            location: {
              type: LocationType.INTERNAL
            }
          },
          select: {
            quantity: true,
            locationId: true
          }
        }
      }
    });

    let totalProductsInStock = 0;
    let totalUnitsInStock = 0;
    let totalInventoryValue = 0;
    let outOfStockCount = 0;
    const lowStockAlerts: Array<{
      productId: string;
      name: string;
      sku: string;
      uom: string;
      categoryName: string;
      unitCost: number;
      onHand: number;
      minQty: number;
      maxQty: number;
      shortage: number;
      isOutOfStock: boolean;
    }> = [];

    for (const prod of allProducts) {
      const onHand = prod.quants.reduce((sum, q) => sum + q.quantity, 0);
      const minQty = prod.reorderRules[0]?.minQty ?? 0;
      const maxQty = prod.reorderRules[0]?.maxQty ?? 0;

      if (onHand > 0) {
        totalProductsInStock += 1;
        totalUnitsInStock += onHand;
        totalInventoryValue += onHand * prod.unitCost;
      } else {
        outOfStockCount += 1;
      }

      // Check if product is low stock (onHand <= minQty when minQty is configured, or onHand === 0)
      const isLow = (minQty > 0 && onHand <= minQty) || onHand === 0;
      if (isLow) {
        lowStockAlerts.push({
          productId: prod.id,
          name: prod.name,
          sku: prod.sku,
          uom: prod.uom,
          categoryName: prod.category?.name || 'Uncategorized',
          unitCost: prod.unitCost,
          onHand,
          minQty,
          maxQty,
          shortage: Math.max(0, minQty - onHand),
          isOutOfStock: onHand === 0
        });
      }
    }

    // Pending Receipts, Deliveries, Transfers
    const [pendingReceipts, pendingDeliveries, internalTransfersScheduled] = await Promise.all([
      prisma.operation.count({
        where: {
          type: OperationType.RECEIPT,
          status: { in: [OperationStatus.DRAFT, OperationStatus.READY] }
        }
      }),
      prisma.operation.count({
        where: {
          type: OperationType.DELIVERY,
          status: { in: [OperationStatus.DRAFT, OperationStatus.WAITING, OperationStatus.READY] }
        }
      }),
      prisma.operation.count({
        where: {
          type: OperationType.INTERNAL,
          status: { in: [OperationStatus.DRAFT, OperationStatus.READY] }
        }
      })
    ]);

    // 4. Filtered Operations Snapshot
    const opWhere: Prisma.OperationWhereInput = {};

    if (type && typeof type === 'string' && type !== 'ALL') {
      opWhere.type = type as OperationType;
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      opWhere.status = status as OperationStatus;
    }

    if (warehouseId && typeof warehouseId === 'string' && warehouseId !== 'ALL') {
      opWhere.OR = [
        { sourceLocation: { warehouseId } },
        { destLocation: { warehouseId } }
      ];
    }

    if (categoryId && typeof categoryId === 'string' && categoryId !== 'ALL') {
      opWhere.lines = {
        some: {
          product: { categoryId }
        }
      };
    }

    const recentOperations = await prisma.operation.findMany({
      where: opWhere,
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: {
        sourceLocation: {
          select: { id: true, name: true, shortCode: true, fullPath: true, warehouse: { select: { shortCode: true } } }
        },
        destLocation: {
          select: { id: true, name: true, shortCode: true, fullPath: true, warehouse: { select: { shortCode: true } } }
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
      }
    });

    const formattedOperations = recentOperations.map((op) => {
      const isLate =
        op.scheduledDate &&
        new Date(op.scheduledDate) < todayStart &&
        op.status !== OperationStatus.DONE &&
        op.status !== OperationStatus.CANCELED;

      const totalItems = op.lines.reduce((sum, l) => sum + (l.demandQty || l.doneQty || 0), 0);

      return {
        id: op.id,
        reference: op.reference,
        type: op.type,
        status: op.status,
        contact: op.contact,
        scheduledDate: op.scheduledDate,
        createdAt: op.createdAt,
        isLate: !!isLate,
        sourceLocation: op.sourceLocation,
        destLocation: op.destLocation,
        responsible: op.responsible,
        linesCount: op.lines.length,
        totalItems,
        sampleProduct: op.lines[0]?.product?.name || null
      };
    });

    res.json({
      receiptsCard: {
        toReceive: receiptsToReceive,
        late: receiptsLate,
        operations: receiptsScheduled
      },
      deliveriesCard: {
        toDeliver: deliveriesToDeliver,
        late: deliveriesLate,
        waiting: deliveriesWaiting,
        operations: deliveriesScheduled
      },
      kpis: {
        totalProductsInStock,
        totalUnitsInStock,
        totalInventoryValue,
        lowStockCount: lowStockAlerts.length,
        outOfStockCount,
        pendingReceipts,
        pendingDeliveries,
        internalTransfersScheduled
      },
      lowStockAlerts: lowStockAlerts.slice(0, 10),
      operationsSnapshot: formattedOperations
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboard/alerts - lightweight low stock alerts for top nav notification badge
router.get('/alerts', requireAuth, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        sku: true,
        uom: true,
        reorderRules: {
          select: { minQty: true, maxQty: true }
        },
        quants: {
          where: {
            location: {
              type: LocationType.INTERNAL
            }
          },
          select: { quantity: true }
        }
      }
    });

    const alerts = [];
    for (const p of products) {
      const onHand = p.quants.reduce((sum, q) => sum + q.quantity, 0);
      const minQty = p.reorderRules[0]?.minQty ?? 0;
      if ((minQty > 0 && onHand <= minQty) || onHand === 0) {
        alerts.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          uom: p.uom,
          onHand,
          minQty,
          shortage: Math.max(0, minQty - onHand)
        });
      }
    }

    res.json({
      count: alerts.length,
      alerts
    });
  } catch (error) {
    next(error);
  }
});

export default router;
