import { api } from './client';
import { OperationType } from './operations';
import { DocumentStatus } from '../lib/status';

export interface ReceiptsCardMetrics {
  toReceive: number;
  late: number;
  operations: number;
}

export interface DeliveriesCardMetrics {
  toDeliver: number;
  late: number;
  waiting: number;
  operations: number;
}

export interface DashboardKpis {
  totalProductsInStock: number;
  totalUnitsInStock: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  internalTransfersScheduled: number;
}

export interface LowStockAlertItem {
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
}

export interface DashboardOperationSnapshot {
  id: string;
  reference: string;
  type: OperationType;
  status: DocumentStatus;
  contact?: string | null;
  scheduledDate?: string | null;
  createdAt: string;
  isLate: boolean;
  sourceLocation?: {
    id: string;
    name: string;
    shortCode: string;
    fullPath: string;
  } | null;
  destLocation?: {
    id: string;
    name: string;
    shortCode: string;
    fullPath: string;
  } | null;
  responsible?: {
    id: string;
    name: string;
    loginId: string;
  } | null;
  linesCount: number;
  totalItems: number;
  sampleProduct?: string | null;
}

export interface DashboardResponse {
  receiptsCard: ReceiptsCardMetrics;
  deliveriesCard: DeliveriesCardMetrics;
  kpis: DashboardKpis;
  lowStockAlerts: LowStockAlertItem[];
  operationsSnapshot: DashboardOperationSnapshot[];
}

export interface DashboardFilterParams {
  type?: string;
  status?: string;
  warehouseId?: string;
  categoryId?: string;
}

export interface AlertsSummaryResponse {
  count: number;
  alerts: Array<{
    id: string;
    name: string;
    sku: string;
    uom: string;
    onHand: number;
    minQty: number;
    shortage: number;
  }>;
}

export const fetchDashboard = async (params?: DashboardFilterParams): Promise<DashboardResponse> => {
  const { data } = await api.get<DashboardResponse>('/dashboard', { params });
  return data;
};

export const fetchLowStockAlerts = async (): Promise<AlertsSummaryResponse> => {
  const { data } = await api.get<AlertsSummaryResponse>('/dashboard/alerts');
  return data;
};
