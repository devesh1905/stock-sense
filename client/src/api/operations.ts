import { api } from './client';
import { DocumentStatus } from '../lib/status';

export type OperationType = 'RECEIPT' | 'DELIVERY' | 'INTERNAL' | 'ADJUSTMENT';

export interface OperationLineItem {
  id?: string;
  productId: string;
  demandQty: number;
  doneQty?: number;
  countedQty?: number | null;
  product?: {
    id: string;
    name: string;
    sku: string;
    uom: string;
    unitCost: number;
  };
}

export interface StockMoveItem {
  id: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  operationId?: string | null;
  userId?: string | null;
  createdAt: string;
  product: {
    id: string;
    name: string;
    sku: string;
    uom: string;
    unitCost: number;
  };
  fromLocation: {
    id: string;
    name: string;
    shortCode: string;
    fullPath: string;
  };
  toLocation: {
    id: string;
    name: string;
    shortCode: string;
    fullPath: string;
  };
  user?: {
    id: string;
    name: string;
    loginId: string;
  } | null;
}

export interface OperationItem {
  id: string;
  reference: string;
  type: OperationType;
  status: DocumentStatus;
  contact?: string | null;
  deliveryAddress?: string | null;
  scheduledDate?: string | null;
  sourceLocationId?: string | null;
  destLocationId?: string | null;
  responsibleId?: string | null;
  pickedAt?: string | null;
  packedAt?: string | null;
  validatedAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  isLate?: boolean;
  totalLines?: number;
  totalQty?: number;
  sourceLocation?: {
    id: string;
    name: string;
    shortCode: string;
    fullPath: string;
    warehouseId?: string | null;
    warehouse?: {
      id: string;
      name: string;
      shortCode: string;
    } | null;
  } | null;
  destLocation?: {
    id: string;
    name: string;
    shortCode: string;
    fullPath: string;
    warehouseId?: string | null;
    warehouse?: {
      id: string;
      name: string;
      shortCode: string;
    } | null;
  } | null;
  responsible?: {
    id: string;
    name: string;
    loginId: string;
    role?: string;
  } | null;
  lines: OperationLineItem[];
  moves?: StockMoveItem[];
  lineAvailability?: Array<{
    productId: string;
    onHand: number;
    freeToUse: number;
    isShort: boolean;
  }>;
}

export interface CreateOperationPayload {
  type: OperationType;
  contact?: string;
  deliveryAddress?: string;
  scheduledDate?: string;
  sourceLocationId?: string;
  destLocationId?: string;
  notes?: string;
  lines: Array<{
    productId: string;
    demandQty: number;
    countedQty?: number;
  }>;
}

export const fetchOperations = async (params?: {
  type?: OperationType;
  status?: DocumentStatus;
  search?: string;
  warehouseId?: string;
}): Promise<OperationItem[]> => {
  const { data } = await api.get<{ ok: boolean; data: OperationItem[] }>('/operations', { params });
  return data.data;
};

export const fetchOperation = async (id: string): Promise<OperationItem> => {
  const { data } = await api.get<{ ok: boolean; data: OperationItem }>(`/operations/${id}`);
  return data.data;
};

export const createOperation = async (payload: CreateOperationPayload): Promise<OperationItem> => {
  const { data } = await api.post<{ ok: boolean; data: OperationItem }>('/operations', payload);
  return data.data;
};

export const updateOperation = async (
  id: string,
  payload: Partial<CreateOperationPayload> & { pickedAt?: string | null; packedAt?: string | null }
): Promise<OperationItem> => {
  const { data } = await api.put<{ ok: boolean; data: OperationItem }>(`/operations/${id}`, payload);
  return data.data;
};

export const markOperationToDo = async (
  id: string
): Promise<{ ok: boolean; data: OperationItem; isWaiting: boolean; shortages: any[]; message: string }> => {
  const { data } = await api.post(`/operations/${id}/to-do`);
  return data;
};

export const validateOperationApi = async (
  id: string
): Promise<{ ok: boolean; data: { reference: string; movesCount: number; message: string } }> => {
  const { data } = await api.post(`/operations/${id}/validate`);
  return data;
};

export const cancelOperationApi = async (
  id: string
): Promise<{ ok: boolean; data: OperationItem; message: string }> => {
  const { data } = await api.post(`/operations/${id}/cancel`);
  return data;
};

export const fetchStockConsistency = async (): Promise<{
  consistent: boolean;
  checkedLocations: number;
  checkedProducts: number;
  discrepancies: any[];
}> => {
  const { data } = await api.get<{ ok: boolean; data: any }>('/operations/consistency');
  return data.data;
};
