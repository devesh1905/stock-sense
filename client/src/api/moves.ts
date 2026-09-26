import { api } from './client';
import { OperationType } from './operations';

export type MoveDirection = 'IN' | 'OUT' | 'INTERNAL' | 'ADJUSTMENT';

export interface MoveProduct {
  id: string;
  sku: string;
  name: string;
  uom: string;
  unitCost: number;
  category?: {
    id: string;
    name: string;
  } | null;
}

export interface MoveLocation {
  id: string;
  name: string;
  shortCode: string;
  fullPath: string;
  type: string;
  warehouse?: {
    id: string;
    name: string;
    shortCode: string;
  } | null;
}

export interface MoveOperation {
  id: string;
  reference: string;
  type: OperationType;
  status: string;
  contact?: string | null;
  scheduledDate?: string | null;
  validatedAt?: string | null;
  responsible?: {
    id: string;
    name: string;
    loginId: string;
  } | null;
}

export interface MoveRecord {
  id: string;
  productId: string;
  fromLocationId: string;
  toLocationId: string;
  quantity: number;
  signedQuantity: number;
  direction: MoveDirection;
  operationId?: string | null;
  userId?: string | null;
  createdAt: string;
  product: MoveProduct;
  fromLocation: MoveLocation;
  toLocation: MoveLocation;
  operation?: MoveOperation | null;
  user?: {
    id: string;
    name: string;
    loginId: string;
  } | null;
}

export interface MovesResponse {
  moves: MoveRecord[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MovesSummaryResponse {
  totalMoves: number;
  totalIn: number;
  totalOut: number;
  totalInternal: number;
  totalAdjustment: number;
  netChange: number;
}

export interface MoveFilters {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  direction?: string;
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const fetchMoves = async (params?: MoveFilters): Promise<MovesResponse> => {
  const { data } = await api.get<MovesResponse>('/moves', { params });
  return data;
};

export const fetchMovesSummary = async (params?: { warehouseId?: string; productId?: string }): Promise<MovesSummaryResponse> => {
  const { data } = await api.get<MovesSummaryResponse>('/moves/summary', { params });
  return data;
};
