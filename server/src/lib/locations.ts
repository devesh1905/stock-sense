import { prisma } from './prisma.js';

export const ensureVirtualLocations = async () => {
  const virtuals = [
    { name: 'Vendors', shortCode: 'Vendor', fullPath: 'Partner/Vendor', type: 'VENDOR' as const },
    { name: 'Customers', shortCode: 'Customer', fullPath: 'Partner/Customer', type: 'CUSTOMER' as const },
    { name: 'Inventory Adjustment', shortCode: 'Adjustment', fullPath: 'Virtual/Adjustment', type: 'ADJUSTMENT' as const }
  ];

  for (const v of virtuals) {
    const existing = await prisma.location.findFirst({
      where: { type: v.type, warehouseId: null }
    });
    if (!existing) {
      await prisma.location.create({
        data: {
          name: v.name,
          shortCode: v.shortCode,
          fullPath: v.fullPath,
          type: v.type,
          warehouseId: null
        }
      });
    }
  }
};
