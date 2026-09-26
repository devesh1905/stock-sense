import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';
import { OperationType, OperationStatus, Prisma } from '@prisma/client';

export interface ConsistencyCheckResult {
  consistent: boolean;
  checkedLocations: number;
  checkedProducts: number;
  discrepancies: Array<{
    productId: string;
    productSku: string;
    locationId: string;
    locationFullPath: string;
    quantQuantity: number;
    ledgerQuantity: number;
    difference: number;
  }>;
}

/**
 * Generate standardized reference sequence: <WarehouseShortCode>/<Type>/<0001>
 * Examples: WH/IN/0001, WH/OUT/0001, WH/INT/0001, WH/ADJ/0001
 */
export async function generateOperationReference(
  type: OperationType,
  warehouseIdOrLocationId?: string | null,
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<string> {
  let warehouseShortCode = 'WH';

  if (warehouseIdOrLocationId) {
    // Check if it's a warehouse ID
    const wh = await tx.warehouse.findUnique({
      where: { id: warehouseIdOrLocationId }
    });
    if (wh) {
      warehouseShortCode = wh.shortCode;
    } else {
      // Check if it's a location ID
      const loc = await tx.location.findUnique({
        where: { id: warehouseIdOrLocationId },
        include: { warehouse: true }
      });
      if (loc?.warehouse?.shortCode) {
        warehouseShortCode = loc.warehouse.shortCode;
      }
    }
  }

  // Map OperationType to reference mnemonic
  const typeMap: Record<OperationType, string> = {
    RECEIPT: 'IN',
    DELIVERY: 'OUT',
    INTERNAL: 'INT',
    ADJUSTMENT: 'ADJ'
  };

  const prefix = `${warehouseShortCode}/${typeMap[type]}`;

  // Count existing operations matching this prefix
  const count = await tx.operation.count({
    where: {
      reference: {
        startsWith: prefix
      }
    }
  });

  const nextNum = (count + 1).toString().padStart(4, '0');
  let reference = `${prefix}/${nextNum}`;

  // Check collision in case of deleted records or concurrent creations
  let attempt = 0;
  while (attempt < 10) {
    const existing = await tx.operation.findUnique({
      where: { reference }
    });
    if (!existing) break;
    attempt++;
    const retryNum = (count + 1 + attempt).toString().padStart(4, '0');
    reference = `${prefix}/${retryNum}`;
  }

  return reference;
}

/**
 * Calculate real-time free-to-use and reserved quantities for a product in a location
 */
export async function calculateStockAvailability(
  productId: string,
  locationId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<{ onHand: number; reserved: number; freeToUse: number }> {
  const quant = await tx.stockQuant.findUnique({
    where: {
      productId_locationId: {
        productId,
        locationId
      }
    }
  });

  const onHand = quant ? quant.quantity : 0;

  // Reserved = sum of demand of open (WAITING or READY) Delivery or Transfer lines where source is this location
  const reservedLines = await tx.operationLine.findMany({
    where: {
      productId,
      operation: {
        sourceLocationId: locationId,
        type: { in: ['DELIVERY', 'INTERNAL'] },
        status: { in: ['WAITING', 'READY'] }
      }
    },
    select: {
      demandQty: true,
      doneQty: true
    }
  });

  const reserved = reservedLines.reduce((acc, line) => acc + (line.demandQty - line.doneQty), 0);
  const freeToUse = Math.max(0, onHand - reserved);

  return { onHand, reserved, freeToUse };
}

/**
 * Validate an operation atomically inside a PostgreSQL transaction:
 * 1. Checks that status is READY (or DRAFT for adjustment)
 * 2. Checks immutability (DONE and CANCELED cannot be validated)
 * 3. Checks stock availability for internal source locations
 * 4. Updates StockQuant balances
 * 5. Records immutable StockMove records in the ledger
 * 6. Sets operation status to DONE and records validatedAt timestamp
 * 7. Automatically checks any WAITING delivery orders and transitions to READY if stock is now sufficient
 */
export async function validateOperation(
  operationId: string,
  userId: string
): Promise<{ ok: boolean; reference: string; movesCount: number; message: string }> {
  return await prisma.$transaction(async (tx) => {
    // 1. Fetch operation with lines, product, source, and destination
    const operation = await tx.operation.findUnique({
      where: { id: operationId },
      include: {
        lines: {
          include: {
            product: true
          }
        },
        sourceLocation: true,
        destLocation: true
      }
    });

    if (!operation) {
      throw new AppError('Operation not found.', 404);
    }

    // 2. Immutability guard
    if (operation.status === 'DONE') {
      throw new AppError('Validated documents cannot be edited or re-validated. Create an adjustment instead.', 400);
    }

    if (operation.status === 'CANCELED') {
      throw new AppError('Cannot validate a canceled operation.', 400);
    }

    // Receipts, Deliveries and Transfers must be in READY state before Validate
    if (operation.type !== 'ADJUSTMENT' && operation.status !== 'READY') {
      throw new AppError(
        `Operation must be marked "Ready" before it can be validated. Current status: ${operation.status}`,
        400
      );
    }

    if (operation.lines.length === 0) {
      throw new AppError('Cannot validate an operation with no product lines.', 400);
    }

    if (!operation.sourceLocationId || !operation.destLocationId) {
      throw new AppError('Operation is missing source or destination location.', 400);
    }

    const sourceLoc = operation.sourceLocation;
    const destLoc = operation.destLocation;

    if (!sourceLoc || !destLoc) {
      throw new AppError('Source or destination location does not exist.', 400);
    }

    let movesCount = 0;

    // 3. Process each line item
    for (const line of operation.lines) {
      const moveQty = line.demandQty;

      if (moveQty <= 0 && operation.type !== 'ADJUSTMENT') {
        throw new AppError(`Line item for ${line.product.name} has non-positive quantity: ${moveQty}`, 400);
      }

      // Check available stock if moving FROM an internal location
      if (sourceLoc.type === 'INTERNAL') {
        const sourceQuant = await tx.stockQuant.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: sourceLoc.id
            }
          }
        });

        const currentSourceStock = sourceQuant ? sourceQuant.quantity : 0;

        if (currentSourceStock < moveQty) {
          throw new AppError(
            `Insufficient stock: Only ${currentSourceStock} ${line.product.uom} of ${line.product.name} (${line.product.sku}) available at ${sourceLoc.fullPath}. Required: ${moveQty}`,
            400
          );
        }

        // Deduct from source internal location
        await tx.stockQuant.update({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: sourceLoc.id
            }
          },
          data: {
            quantity: currentSourceStock - moveQty
          }
        });
      }

      // Increment destination internal location
      if (destLoc.type === 'INTERNAL') {
        await tx.stockQuant.upsert({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: destLoc.id
            }
          },
          update: {
            quantity: {
              increment: moveQty
            }
          },
          create: {
            productId: line.productId,
            locationId: destLoc.id,
            quantity: moveQty
          }
        });
      }

      // Record immutable StockMove in the Stock Ledger
      await tx.stockMove.create({
        data: {
          productId: line.productId,
          fromLocationId: sourceLoc.id,
          toLocationId: destLoc.id,
          quantity: moveQty,
          operationId: operation.id,
          userId
        }
      });

      // Update line done quantity
      await tx.operationLine.update({
        where: { id: line.id },
        data: {
          doneQty: moveQty
        }
      });

      movesCount++;
    }

    // 4. Mark operation as DONE
    await tx.operation.update({
      where: { id: operation.id },
      data: {
        status: 'DONE',
        validatedAt: new Date()
      }
    });

    // 5. Automatically re-evaluate WAITING deliveries when internal stock increases
    if (destLoc.type === 'INTERNAL') {
      await autoPromoteWaitingDeliveries(destLoc.id, tx);
    }

    return {
      ok: true,
      reference: operation.reference,
      movesCount,
      message: `Operation ${operation.reference} validated successfully. ${movesCount} stock moves recorded in ledger.`
    };
  });
}

/**
 * Automatically inspects open WAITING deliveries from a location and promotes to READY
 * if sufficient stock is now on hand for all lines
 */
export async function autoPromoteWaitingDeliveries(
  locationId: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<number> {
  const waitingDeliveries = await tx.operation.findMany({
    where: {
      type: 'DELIVERY',
      status: 'WAITING',
      sourceLocationId: locationId
    },
    include: {
      lines: true
    }
  });

  let promotedCount = 0;

  for (const delivery of waitingDeliveries) {
    let allLinesAvailable = true;

    for (const line of delivery.lines) {
      const quant = await tx.stockQuant.findUnique({
        where: {
          productId_locationId: {
            productId: line.productId,
            locationId
          }
        }
      });

      const onHand = quant ? quant.quantity : 0;
      if (onHand < line.demandQty) {
        allLinesAvailable = false;
        break;
      }
    }

    if (allLinesAvailable) {
      await tx.operation.update({
        where: { id: delivery.id },
        data: {
          status: 'READY'
        }
      });
      promotedCount++;
    }
  }

  return promotedCount;
}

/**
 * Consistency Check: Verifies that every StockQuant quantity equals the sum of all StockMoves
 * Formula: Quant(product, loc) === Sum(Moves INTO loc) - Sum(Moves OUT OF loc)
 */
export async function verifyStockConsistency(
  productId?: string,
  tx: Prisma.TransactionClient | typeof prisma = prisma
): Promise<ConsistencyCheckResult> {
  const quants = await tx.stockQuant.findMany({
    where: productId ? { productId } : undefined,
    include: {
      product: true,
      location: true
    }
  });

  const discrepancies: ConsistencyCheckResult['discrepancies'] = [];
  const checkedProducts = new Set<string>();
  const checkedLocations = new Set<string>();

  for (const quant of quants) {
    checkedProducts.add(quant.productId);
    checkedLocations.add(quant.locationId);

    // Moves into this location
    const inMoves = await tx.stockMove.aggregate({
      where: {
        productId: quant.productId,
        toLocationId: quant.locationId
      },
      _sum: {
        quantity: true
      }
    });

    // Moves out of this location
    const outMoves = await tx.stockMove.aggregate({
      where: {
        productId: quant.productId,
        fromLocationId: quant.locationId
      },
      _sum: {
        quantity: true
      }
    });

    const totalIn = inMoves._sum.quantity || 0;
    const totalOut = outMoves._sum.quantity || 0;
    const ledgerQuantity = totalIn - totalOut;
    const quantQuantity = quant.quantity;

    if (Math.abs(ledgerQuantity - quantQuantity) > 0.0001) {
      discrepancies.push({
        productId: quant.productId,
        productSku: quant.product.sku,
        locationId: quant.locationId,
        locationFullPath: quant.location.fullPath,
        quantQuantity,
        ledgerQuantity,
        difference: quantQuantity - ledgerQuantity
      });
    }
  }

  return {
    consistent: discrepancies.length === 0,
    checkedLocations: checkedLocations.size,
    checkedProducts: checkedProducts.size,
    discrepancies
  };
}
