import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchHealth } from '../api/client';
import { fetchDashboard, DashboardFilterParams } from '../api/dashboard';
import { fetchWarehouses, fetchCategories } from '../api/masterData';
import { STATUS_CONFIG } from '../lib/status';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Package,
  AlertTriangle,
  Server,
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Plus,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';

export const DashboardPage: React.FC = () => {
  // Filters for the operations snapshot
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [warehouseFilter, setWarehouseFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Backend Health Query
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30000
  });

  // Master data queries for filters
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: fetchWarehouses
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories
  });

  // Main Dashboard Stats Query (Refetches every 30s + on window focus)
  const filterParams: DashboardFilterParams = {
    type: typeFilter !== 'ALL' ? typeFilter : undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    warehouseId: warehouseFilter !== 'ALL' ? warehouseFilter : undefined,
    categoryId: categoryFilter !== 'ALL' ? categoryFilter : undefined
  };

  const {
    data: dashboard,
    isLoading: dashLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: ['dashboard', typeFilter, statusFilter, warehouseFilter, categoryFilter],
    queryFn: () => fetchDashboard(filterParams),
    refetchInterval: 30000
  });

  const kpis = dashboard?.kpis || {
    totalProductsInStock: 0,
    totalUnitsInStock: 0,
    totalInventoryValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    internalTransfersScheduled: 0
  };

  const receiptsCard = dashboard?.receiptsCard || { toReceive: 0, late: 0, operations: 0 };
  const deliveriesCard = dashboard?.deliveriesCard || { toDeliver: 0, late: 0, waiting: 0, operations: 0 };
  const lowStockAlerts = dashboard?.lowStockAlerts || [];
  const operationsSnapshot = dashboard?.operationsSnapshot || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time inventory levels, pending operations, and stock health analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh dashboard data"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <Link
            to="/operations/receipts/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-2xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Operation</span>
          </Link>
        </div>
      </div>

      {/* Backend & Database Health Status Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${health?.db ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">StockSense System Health</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Engine
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  API: {healthLoading ? (
                    <span className="text-slate-400">checking...</span>
                  ) : health?.ok ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                    </span>
                  ) : (
                    <span className="text-rose-600 font-medium flex items-center gap-0.5">
                      <XCircle className="w-3.5 h-3.5" /> Offline
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-slate-400" />
                  Database: {healthLoading ? (
                    <span className="text-slate-400">checking...</span>
                  ) : health?.db ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Connected (PostgreSQL 16)
                    </span>
                  ) : (
                    <span className="text-rose-600 font-medium flex items-center gap-0.5">
                      <XCircle className="w-3.5 h-3.5" /> Disconnected
                    </span>
                  )}
                </span>
                <span className="hidden md:inline-flex text-slate-400">
                  Uptime: {health?.uptime ? `${Math.floor(health.uptime / 60)}m` : '0m'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400 text-right">
            Last sync: {format(new Date(), 'HH:mm:ss')}
          </div>
        </div>
      </div>

      {/* Mockup Dashboard Cards: Receipt Card & Delivery Card (Mockup 05-dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Receipt Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                  <ArrowDownToLine className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Receipts</h2>
                  <p className="text-xs text-slate-400">Inbound supplier shipments</p>
                </div>
              </div>
              <Link
                to="/operations/receipts"
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-0.5"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-5">
              <Link
                to="/operations/receipts"
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-colors"
              >
                {receiptsCard.toReceive} to receive
              </Link>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  receiptsCard.late > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
              <span className={receiptsCard.late > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                {receiptsCard.late} Late
              </span>
            </span>
            <span className="text-slate-500 font-medium">
              {receiptsCard.operations} operations scheduled
            </span>
          </div>
        </div>

        {/* Delivery Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <ArrowUpFromLine className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-slate-900">Delivery Orders</h2>
                  <p className="text-xs text-slate-400">Outbound customer shipments</p>
                </div>
              </div>
              <Link
                to="/operations/deliveries"
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-0.5"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-5">
              <Link
                to="/operations/deliveries"
                className="w-full inline-flex items-center justify-center py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs transition-colors"
              >
                {deliveriesCard.toDeliver} to Deliver
              </Link>
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    deliveriesCard.late > 0 ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'
                  }`}
                />
                <span className={deliveriesCard.late > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                  {deliveriesCard.late} Late
                </span>
              </span>

              <span className="flex items-center gap-1.5 font-medium">
                <span
                  className={`w-2 h-2 rounded-full ${
                    deliveriesCard.waiting > 0 ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                />
                <span className={deliveriesCard.waiting > 0 ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                  {deliveriesCard.waiting} waiting
                </span>
              </span>
            </div>

            <span className="text-slate-500 font-medium">
              {deliveriesCard.operations} operations scheduled
            </span>
          </div>
        </div>
      </div>

      {/* PS KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold tracking-wider uppercase text-slate-400">
            Key Performance Indicators
          </h2>
          <Link
            to="/stock"
            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
          >
            <span>Stock Inventory</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Total In Stock */}
          <Link
            to="/stock"
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Products in Stock</span>
              <Package className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-2">
              {kpis.totalProductsInStock}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 truncate">
              {kpis.totalUnitsInStock} units across warehouses
            </div>
          </Link>

          {/* Low / Out of Stock */}
          <Link
            to="/stock"
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Low / Out of Stock</span>
              <AlertTriangle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
            </div>
            <div
              className={`text-2xl font-bold font-mono mt-2 ${
                kpis.lowStockCount > 0 ? 'text-amber-600' : 'text-slate-900'
              }`}
            >
              {kpis.lowStockCount}
            </div>
            <div className="text-[11px] text-amber-600/80 mt-1 truncate">
              {kpis.outOfStockCount > 0 ? `${kpis.outOfStockCount} zero stock` : 'Under reorder min'}
            </div>
          </Link>

          {/* Pending Receipts */}
          <Link
            to="/operations/receipts"
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Pending Receipts</span>
              <ArrowDownToLine className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-2">
              {kpis.pendingReceipts}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Draft or Ready</div>
          </Link>

          {/* Pending Deliveries */}
          <Link
            to="/operations/deliveries"
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all group"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Pending Deliveries</span>
              <ArrowUpFromLine className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold font-mono text-blue-600 mt-2">
              {kpis.pendingDeliveries}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Waiting or Ready</div>
          </Link>

          {/* Internal Transfers Scheduled */}
          <Link
            to="/operations/transfers"
            className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all group col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span>Internal Transfers</span>
              <ArrowLeftRight className="w-4 h-4 text-indigo-500 group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-600 mt-2">
              {kpis.internalTransfersScheduled}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Scheduled internal</div>
          </Link>
        </div>
      </div>

      {/* Low Stock Alerts Banner & Quick Actions (If Any) */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-amber-50/70 rounded-xl border border-amber-200 p-5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/70">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-amber-900">
                  Low Stock Attention Needed ({lowStockAlerts.length} items)
                </h3>
                <p className="text-xs text-amber-700">
                  Products have fallen below minimum safety thresholds or are depleted
                </p>
              </div>
            </div>
            <Link
              to="/operations/receipts/new"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-2xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Replenishment Receipt</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3.5">
            {lowStockAlerts.slice(0, 6).map((item) => (
              <div
                key={item.productId}
                className="bg-white rounded-lg border border-amber-200/90 p-3 shadow-2xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                      {item.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        item.isOutOfStock
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.isOutOfStock ? 'OUT OF STOCK' : 'LOW STOCK'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    {item.sku} • {item.categoryName}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">On Hand: </span>
                    <span className="font-mono font-bold text-slate-800">
                      {item.onHand} {item.uom}
                    </span>
                    <span className="text-slate-400 text-[11px]"> (min: {item.minQty})</span>
                  </div>
                  <Link
                    to="/stock"
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    Adjust &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Operations Snapshot List with Interactive Multi-Filters */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Header & Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="font-semibold text-base text-slate-900">Operations Snapshot</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time stream of warehouse movements filtered across document type, status, and warehouse
              </p>
            </div>
            <Link
              to="/move-history"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1 self-start sm:self-auto"
            >
              <span>View full audit ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Document Type Pills */}
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50/70 p-0.5 text-xs font-medium">
              <button
                onClick={() => setTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  typeFilter === 'ALL'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Documents
              </button>
              <button
                onClick={() => setTypeFilter('RECEIPT')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  typeFilter === 'RECEIPT'
                    ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Receipts
              </button>
              <button
                onClick={() => setTypeFilter('DELIVERY')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  typeFilter === 'DELIVERY'
                    ? 'bg-white text-blue-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Deliveries
              </button>
              <button
                onClick={() => setTypeFilter('INTERNAL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  typeFilter === 'INTERNAL'
                    ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Transfers
              </button>
              <button
                onClick={() => setTypeFilter('ADJUSTMENT')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  typeFilter === 'ADJUSTMENT'
                    ? 'bg-white text-amber-700 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Adjustments
              </button>
            </div>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="WAITING">Waiting</option>
              <option value="READY">Ready</option>
              <option value="DONE">Done</option>
              <option value="CANCELED">Canceled</option>
            </select>

            {/* Warehouse Dropdown */}
            <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses?.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.name} ({wh.shortCode})
                </option>
              ))}
            </select>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Reset Filter Button */}
            {(typeFilter !== 'ALL' || statusFilter !== 'ALL' || warehouseFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setTypeFilter('ALL');
                  setStatusFilter('ALL');
                  setWarehouseFilter('ALL');
                  setCategoryFilter('ALL');
                }}
                className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Snapshot Operations Table */}
        {dashLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-2" />
            Loading live operations snapshot...
          </div>
        ) : operationsSnapshot.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No operations match the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Schedule Date</th>
                  <th className="px-5 py-3">Contact / Partner</th>
                  <th className="px-5 py-3">Route</th>
                  <th className="px-5 py-3">Items</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {operationsSnapshot.map((op) => {
                  const statusConf = STATUS_CONFIG[op.status] || STATUS_CONFIG.DONE;
                  const docUrl =
                    op.type === 'RECEIPT'
                      ? `/operations/receipts/${op.id}`
                      : op.type === 'DELIVERY'
                      ? `/operations/deliveries/${op.id}`
                      : op.type === 'INTERNAL'
                      ? `/operations/transfers/${op.id}`
                      : `/operations/adjustments/${op.id}`;

                  return (
                    <tr
                      key={op.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        op.isLate ? 'border-l-4 border-l-rose-500 bg-rose-50/20' : ''
                      }`}
                    >
                      {/* Reference */}
                      <td className="px-5 py-3 font-mono font-medium">
                        <Link
                          to={docUrl}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {op.reference}
                        </Link>
                      </td>

                      {/* Type Badge */}
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                            op.type === 'RECEIPT'
                              ? 'bg-emerald-50 text-emerald-700'
                              : op.type === 'DELIVERY'
                              ? 'bg-blue-50 text-blue-700'
                              : op.type === 'INTERNAL'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {op.type === 'RECEIPT'
                            ? 'Receipt'
                            : op.type === 'DELIVERY'
                            ? 'Delivery'
                            : op.type === 'INTERNAL'
                            ? 'Transfer'
                            : 'Adjustment'}
                        </span>
                      </td>

                      {/* Schedule Date */}
                      <td className="px-5 py-3 whitespace-nowrap text-slate-600">
                        {op.scheduledDate ? (
                          <div className="flex items-center gap-1.5">
                            <span>{format(new Date(op.scheduledDate), 'dd MMM yyyy')}</span>
                            {op.isLate && (
                              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                                Late
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3 text-slate-800 font-medium max-w-[160px] truncate">
                        {op.contact || (
                          <span className="text-slate-400 italic">Internal</span>
                        )}
                      </td>

                      {/* Route */}
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-600">
                        <span>{op.sourceLocation?.shortCode || 'Vendor'}</span>
                        <span className="mx-1 text-slate-400">&rarr;</span>
                        <span>{op.destLocation?.shortCode || 'Customer'}</span>
                      </td>

                      {/* Items */}
                      <td className="px-5 py-3 text-slate-600">
                        <span className="font-semibold text-slate-800">{op.totalItems}</span>
                        <span className="text-slate-400"> in {op.linesCount} lines</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusConf.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={docUrl}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
