import { api } from './client';

export interface Warehouse {
  id: string;
  name: string;
  shortCode: string;
  address?: string | null;
  active: boolean;
  _count?: {
    locations: number;
  };
}

export interface Location {
  id: string;
  name: string;
  shortCode: string;
  fullPath: string;
  type: 'INTERNAL' | 'VENDOR' | 'CUSTOMER' | 'ADJUSTMENT';
  warehouseId?: string | null;
  active: boolean;
  warehouse?: {
    id: string;
    name: string;
    shortCode: string;
  } | null;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    products: number;
  };
}

export interface ReorderRule {
  id: string;
  productId: string;
  locationId?: string | null;
  minQty: number;
  maxQty: number;
}

export interface ProductStockRow {
  id: string;
  name: string;
  sku: string;
  uom: string;
  unitCost: number;
  category: string;
  categoryId?: string | null;
  onHand: number;
  freeToUse: number;
  reserved: number;
  reorderMin?: number | null;
  reorderMax?: number | null;
  stockStatus: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  locations: Array<{
    locationId: string;
    locationName: string;
    fullPath: string;
    warehouseName?: string;
    quantity: number;
  }>;
}

// Warehouses
export const fetchWarehouses = async (): Promise<Warehouse[]> => {
  const { data } = await api.get<{ ok: boolean; data: Warehouse[] }>('/warehouses');
  return data.data;
};

export const createWarehouse = async (payload: {
  name: string;
  shortCode: string;
  address?: string;
}): Promise<Warehouse> => {
  const { data } = await api.post<{ ok: boolean; data: Warehouse }>('/warehouses', payload);
  return data.data;
};

export const deleteWarehouse = async (id: string): Promise<void> => {
  await api.delete(`/warehouses/${id}`);
};

// Locations
export const fetchLocations = async (params?: { warehouseId?: string; type?: string }): Promise<Location[]> => {
  const { data } = await api.get<{ ok: boolean; data: Location[] }>('/locations', { params });
  return data.data;
};

export const createLocation = async (payload: {
  name: string;
  shortCode: string;
  warehouseId?: string;
  type?: 'INTERNAL' | 'VENDOR' | 'CUSTOMER' | 'ADJUSTMENT';
}): Promise<Location> => {
  const { data } = await api.post<{ ok: boolean; data: Location }>('/locations', payload);
  return data.data;
};

export const deleteLocation = async (id: string): Promise<void> => {
  await api.delete(`/locations/${id}`);
};

// Categories
export const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get<{ ok: boolean; data: Category[] }>('/categories');
  return data.data;
};

export const createCategory = async (payload: { name: string; description?: string }): Promise<Category> => {
  const { data } = await api.post<{ ok: boolean; data: Category }>('/categories', payload);
  return data.data;
};

// Products & Stock
export const fetchStock = async (params?: { search?: string; categoryId?: string }): Promise<ProductStockRow[]> => {
  const { data } = await api.get<{ ok: boolean; data: ProductStockRow[] }>('/stock', { params });
  return data.data;
};

export const createProduct = async (payload: {
  name: string;
  sku: string;
  categoryId?: string | null;
  uom: string;
  unitCost: number;
  initialStock?: number;
  initialLocationId?: string;
}): Promise<void> => {
  await api.post('/products', payload);
};

export const updateReorderRule = async (
  productId: string,
  payload: { minQty: number; maxQty: number; locationId?: string | null }
): Promise<void> => {
  await api.post(`/products/${productId}/reorder-rule`, payload);
};

export const adjustStockInline = async (payload: {
  productId: string;
  locationId: string;
  countedQty: number;
}): Promise<{ message: string }> => {
  const { data } = await api.post<{ ok: boolean; message: string }>('/stock/adjust-inline', payload);
  return data;
};
