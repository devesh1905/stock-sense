import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  SlidersHorizontal,
  Download,
  Calendar,
  Building2,
  List,
  Columns3,
  ExternalLink,
  RotateCcw,
  Package,
  Layers,
  TrendingUp,
  TrendingDown,
  X
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fetchMoves, fetchMovesSummary, MoveRecord } from '../api/moves';
import { fetchWarehouses } from '../api/masterData';
import { Sheet, SheetHeader, SheetTitle, SheetDescription } from '../components/ui/sheet';
import { STATUS_CONFIG, DocumentStatus } from '../lib/status';

export const MoveHistoryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [directionFilter, setDirectionFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [dateRangePreset, setDateRangePreset] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => {
    return (localStorage.getItem('stock-moves-view') as 'list' | 'kanban') || 'list';
  });

  // Selected move for side drawer
  const [selectedMove, setSelectedMove] = useState<MoveRecord | null>(null);

  // Compute date range
  const { dateFrom, dateTo } = React.useMemo(() => {
    const now = new Date();
    if (dateRangePreset === 'TODAY') {
      return {
        dateFrom: startOfDay(now).toISOString(),
        dateTo: endOfDay(now).toISOString()
      };
    }
    if (dateRangePreset === '7D') {
      return {
        dateFrom: startOfDay(subDays(now, 7)).toISOString(),
        dateTo: endOfDay(now).toISOString()
      };
    }
    if (dateRangePreset === '30D') {
      return {
        dateFrom: startOfDay(subDays(now, 30)).toISOString(),
        dateTo: endOfDay(now).toISOString()
      };
    }
    return { dateFrom: undefined, dateTo: undefined };
  }, [dateRangePreset]);

  // Fetch warehouses for filter
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: fetchWarehouses
  });

  // Fetch moves with pagination and filters
  const { data: movesData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['moves', page, search, directionFilter, typeFilter, warehouseId, dateFrom, dateTo],
    queryFn: () =>
      fetchMoves({
        page,
        limit: 50,
        search: search.trim() || undefined,
        direction: directionFilter !== 'ALL' ? directionFilter : undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        warehouseId: warehouseId || undefined,
        dateFrom,
        dateTo
      })
  });

  // Fetch summary metrics
  const { data: summaryData } = useQuery({
    queryKey: ['moves-summary', warehouseId],
    queryFn: () => fetchMovesSummary({ warehouseId: warehouseId || undefined })
  });

  const handleViewChange = (mode: 'list' | 'kanban') => {
    setViewMode(mode);
    localStorage.setItem('stock-moves-view', mode);
  };

  const handleResetFilters = () => {
    setSearch('');
    setDirectionFilter('ALL');
    setTypeFilter('ALL');
    setWarehouseId('');
    setDateRangePreset('ALL');
    setPage(1);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (!movesData?.moves || movesData.moves.length === 0) return;

    const headers = [
      'Reference',
      'Date',
      'Time',
      'Contact',
      'SKU',
      'Product Name',
      'From Location',
      'To Location',
      'Direction',
      'Quantity',
      'Unit Cost (INR)',
      'Status'
    ];

    const rows = movesData.moves.map((m) => [
      `"${m.operation?.reference || 'DIRECT'}"`,
      `"${format(new Date(m.createdAt), 'yyyy-MM-dd')}"`,
      `"${format(new Date(m.createdAt), 'HH:mm:ss')}"`,
      `"${m.operation?.contact || 'N/A'}"`,
      `"${m.product.sku}"`,
      `"${m.product.name.replace(/"/g, '""')}"`,
      `"${m.fromLocation.fullPath}"`,
      `"${m.toLocation.fullPath}"`,
      `"${m.direction}"`,
      m.signedQuantity,
      m.product.unitCost,
      `"${m.operation?.status || 'DONE'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `stock-moves-ledger-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const moves = movesData?.moves || [];
  const pagination = movesData?.pagination || { total: 0, page: 1, limit: 50, totalPages: 1 };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Move History</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              Audit Ledger
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Immutable, double-entry audit record of all warehouse receipts, deliveries, transfers, and adjustments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Switch */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              onClick={() => handleViewChange('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => handleViewChange('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-50 text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            title="Refresh Ledger"
            className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-sm shadow-2xs transition-colors"
          >
            <RotateCcw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={moves.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-medium shadow-2xs transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Ledger Moves</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 mt-1.5">
            {summaryData?.totalMoves ?? pagination.total}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Immutable audit entries</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-emerald-700">
            <span>Total Inbound (Receipts)</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1.5">
            +{summaryData?.totalIn ?? 0}
          </div>
          <div className="text-[11px] text-emerald-600/70 mt-0.5">Received from vendors</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-rose-700">
            <span>Total Outbound (Deliveries)</span>
            <ArrowUpRight className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1.5">
            -{summaryData?.totalOut ?? 0}
          </div>
          <div className="text-[11px] text-rose-600/70 mt-0.5">Shipped to customers</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-indigo-700">
            <span>Internal Transfers</span>
            <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600 mt-1.5">
            {summaryData?.totalInternal ?? 0}
          </div>
          <div className="text-[11px] text-indigo-600/70 mt-0.5">Moved between locations</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-2xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Net Stock Movement</span>
            {(summaryData?.netChange ?? 0) >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div
            className={`text-xl font-bold font-mono mt-1.5 ${
              (summaryData?.netChange ?? 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {(summaryData?.netChange ?? 0) >= 0 ? `+${summaryData?.netChange ?? 0}` : summaryData?.netChange ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Inbound minus outbound</div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search reference, contact, SKU, product name..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50/50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls: Warehouse, Date Presets, Reset */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Warehouse select */}
            <div className="relative">
              <select
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-7 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="">All Warehouses</option>
                {warehouses?.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.shortCode})
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Date range presets */}
            <div className="relative">
              <select
                value={dateRangePreset}
                onChange={(e) => {
                  setDateRangePreset(e.target.value);
                  setPage(1);
                }}
                className="pl-8 pr-7 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="ALL">All Time</option>
                <option value="TODAY">Today</option>
                <option value="7D">Last 7 Days</option>
                <option value="30D">Last 30 Days</option>
              </select>
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Reset Filters */}
            {(search || directionFilter !== 'ALL' || typeFilter !== 'ALL' || warehouseId || dateRangePreset !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                title="Clear all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills for Direction / Operation Type */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
            Direction:
          </span>
          <button
            onClick={() => {
              setDirectionFilter('ALL');
              setTypeFilter('ALL');
              setPage(1);
            }}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              directionFilter === 'ALL' && typeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Movements
          </button>
          <button
            onClick={() => {
              setDirectionFilter('IN');
              setTypeFilter('ALL');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              directionFilter === 'IN'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Inbound (+ In)</span>
          </button>
          <button
            onClick={() => {
              setDirectionFilter('OUT');
              setTypeFilter('ALL');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              directionFilter === 'OUT'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Outbound (− Out)</span>
          </button>
          <button
            onClick={() => {
              setDirectionFilter('INTERNAL');
              setTypeFilter('ALL');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              directionFilter === 'INTERNAL'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Internal Transfers</span>
          </button>
          <button
            onClick={() => {
              setDirectionFilter('ADJUSTMENT');
              setTypeFilter('ALL');
              setPage(1);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              directionFilter === 'ADJUSTMENT'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjustments (Δ)</span>
          </button>
        </div>
      </div>

      {/* Main Content: Table or Kanban */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-2xs">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600 animate-spin mb-3">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div className="text-sm font-medium text-slate-700">Loading audit ledger...</div>
          <div className="text-xs text-slate-400 mt-1">Retrieving verified stock moves</div>
        </div>
      ) : moves.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Package className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No stock movements found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {search || directionFilter !== 'ALL' || warehouseId
              ? 'No ledger records match the active search and filter criteria.'
              : 'Validate receipts, deliveries, or transfers to record moves in this ledger.'}
          </p>
          {(search || directionFilter !== 'ALL' || warehouseId) && (
            <button
              onClick={handleResetFilters}
              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* Table View per Mockup 04-move-history */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase tracking-wider font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Contact</th>
                  <th className="px-5 py-3">From</th>
                  <th className="px-5 py-3">To</th>
                  <th className="px-5 py-3">Quantity</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {moves.map((move) => {
                  const isIn = move.direction === 'IN';
                  const isOut = move.direction === 'OUT';
                  const isAdj = move.direction === 'ADJUSTMENT';

                  // Row left border accent
                  let borderLeftClass = 'border-l-4 border-l-slate-300';
                  let hoverBgClass = 'hover:bg-slate-50/70';
                  if (isIn) {
                    borderLeftClass = 'border-l-4 border-l-emerald-500';
                    hoverBgClass = 'hover:bg-emerald-50/30';
                  } else if (isOut) {
                    borderLeftClass = 'border-l-4 border-l-rose-500';
                    hoverBgClass = 'hover:bg-rose-50/30';
                  } else if (isAdj) {
                    borderLeftClass = move.signedQuantity >= 0 ? 'border-l-4 border-l-emerald-400' : 'border-l-4 border-l-amber-500';
                    hoverBgClass = 'hover:bg-amber-50/30';
                  } else {
                    borderLeftClass = 'border-l-4 border-l-indigo-400';
                    hoverBgClass = 'hover:bg-indigo-50/30';
                  }

                  const operationStatus = (move.operation?.status || 'DONE') as DocumentStatus;
                  const statusConf = STATUS_CONFIG[operationStatus] || STATUS_CONFIG.DONE;

                  return (
                    <tr
                      key={move.id}
                      onClick={() => setSelectedMove(move)}
                      className={`cursor-pointer transition-colors ${borderLeftClass} ${hoverBgClass}`}
                    >
                      {/* Reference */}
                      <td className="px-5 py-3.5 font-mono font-medium">
                        {move.operation ? (
                          <span className="text-blue-600 hover:text-blue-800 hover:underline">
                            {move.operation.reference}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Direct Move</span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {format(new Date(move.createdAt), 'dd MMM yyyy, HH:mm')}
                      </td>

                      {/* Contact */}
                      <td className="px-5 py-3.5 text-slate-800 font-medium">
                        {move.operation?.contact || (
                          <span className="text-slate-400 italic">Internal</span>
                        )}
                      </td>

                      {/* From Location */}
                      <td className="px-5 py-3.5 text-slate-600 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {move.fromLocation.fullPath}
                        </span>
                      </td>

                      {/* To Location */}
                      <td className="px-5 py-3.5 text-slate-600 font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {move.toLocation.fullPath}
                        </span>
                      </td>

                      {/* Quantity & Product (mockup: In moves green, out moves red) */}
                      <td className="px-5 py-3.5 font-mono">
                        {isIn ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                            <ArrowDownLeft className="w-3.5 h-3.5 shrink-0" />
                            <span>+{move.quantity}</span>
                            <span className="text-slate-700 font-medium font-sans">
                              [{move.product.sku}] {move.product.name}
                            </span>
                          </div>
                        ) : isOut ? (
                          <div className="flex items-center gap-1.5 text-rose-600 font-bold">
                            <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                            <span>-{move.quantity}</span>
                            <span className="text-slate-700 font-medium font-sans">
                              [{move.product.sku}] {move.product.name}
                            </span>
                          </div>
                        ) : isAdj ? (
                          <div className={`flex items-center gap-1.5 font-bold ${move.signedQuantity >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                            <span>{move.signedQuantity >= 0 ? `+${move.quantity}` : `-${move.quantity}`}</span>
                            <span className="text-slate-700 font-medium font-sans">
                              [{move.product.sku}] {move.product.name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-indigo-600 font-bold">
                            <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                            <span>{move.quantity}</span>
                            <span className="text-slate-700 font-medium font-sans">
                              [{move.product.sku}] {move.product.name}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConf.badge}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                          {statusConf.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 bg-slate-50/60 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{pagination.total}</span> moves
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="px-2 py-1 text-slate-600">
                Page {pagination.page} of {pagination.totalPages || 1}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-md font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Kanban View (Grouped by Movement Direction) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Inbound Column */}
          <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-semibold text-sm text-slate-800">Inbound Receipts</h3>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {moves.filter((m) => m.direction === 'IN').length}
              </span>
            </div>
            <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
              {moves
                .filter((m) => m.direction === 'IN')
                .map((move) => (
                  <div
                    key={move.id}
                    onClick={() => setSelectedMove(move)}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-blue-600">
                        {move.operation?.reference || 'DIRECT'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {format(new Date(move.createdAt), 'dd MMM, HH:mm')}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-medium text-slate-800">
                      [{move.product.sku}] {move.product.name}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-emerald-600 flex items-center gap-1">
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                        +{move.quantity} {move.product.uom}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {move.toLocation.fullPath}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Outbound Column */}
          <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <h3 className="font-semibold text-sm text-slate-800">Outbound Deliveries</h3>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                {moves.filter((m) => m.direction === 'OUT').length}
              </span>
            </div>
            <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
              {moves
                .filter((m) => m.direction === 'OUT')
                .map((move) => (
                  <div
                    key={move.id}
                    onClick={() => setSelectedMove(move)}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-blue-600">
                        {move.operation?.reference || 'DIRECT'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {format(new Date(move.createdAt), 'dd MMM, HH:mm')}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-medium text-slate-800">
                      [{move.product.sku}] {move.product.name}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-rose-600 flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        -{move.quantity} {move.product.uom}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {move.fromLocation.fullPath}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Internal Transfers Column */}
          <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h3 className="font-semibold text-sm text-slate-800">Internal Transfers</h3>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {moves.filter((m) => m.direction === 'INTERNAL').length}
              </span>
            </div>
            <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
              {moves
                .filter((m) => m.direction === 'INTERNAL')
                .map((move) => (
                  <div
                    key={move.id}
                    onClick={() => setSelectedMove(move)}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-indigo-300 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-blue-600">
                        {move.operation?.reference || 'DIRECT'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {format(new Date(move.createdAt), 'dd MMM, HH:mm')}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-medium text-slate-800">
                      [{move.product.sku}] {move.product.name}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-indigo-600 flex items-center gap-1">
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        {move.quantity} {move.product.uom}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {move.fromLocation.shortCode} → {move.toLocation.shortCode}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Adjustments Column */}
          <div className="bg-slate-50/70 rounded-xl border border-slate-200 p-3.5 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <h3 className="font-semibold text-sm text-slate-800">Adjustments</h3>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {moves.filter((m) => m.direction === 'ADJUSTMENT').length}
              </span>
            </div>
            <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[600px] pr-1">
              {moves
                .filter((m) => m.direction === 'ADJUSTMENT')
                .map((move) => (
                  <div
                    key={move.id}
                    onClick={() => setSelectedMove(move)}
                    className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs hover:border-amber-300 hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-blue-600">
                        {move.operation?.reference || 'DIRECT'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {format(new Date(move.createdAt), 'dd MMM, HH:mm')}
                      </span>
                    </div>
                    <div className="mt-2 text-xs font-medium text-slate-800">
                      [{move.product.sku}] {move.product.name}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span
                        className={`font-mono font-bold flex items-center gap-1 ${
                          move.signedQuantity >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5" />
                        {move.signedQuantity >= 0 ? `+${move.quantity}` : `-${move.quantity}`}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {move.signedQuantity >= 0 ? move.toLocation.fullPath : move.fromLocation.fullPath}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Side Drawer: Move Record & Operation Detail Sheet */}
      <Sheet open={!!selectedMove} onOpenChange={(open) => !open && setSelectedMove(null)}>
        {selectedMove && (
          <div className="flex flex-col h-full">
            <SheetHeader>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-blue-600">
                  {selectedMove.operation?.reference || 'Direct Inventory Movement'}
                </span>
                <button
                  onClick={() => setSelectedMove(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <SheetTitle className="text-xl font-bold text-slate-900 mt-2">
                Move Audit Record
              </SheetTitle>
              <SheetDescription>
                Transaction recorded on {format(new Date(selectedMove.createdAt), 'dd MMMM yyyy, HH:mm:ss')}
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Product Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Product Details
                </div>
                <div className="font-bold text-base text-slate-900">
                  {selectedMove.product.name}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span>SKU: <strong className="font-mono text-slate-700">{selectedMove.product.sku}</strong></span>
                  <span>•</span>
                  <span>UoM: <strong>{selectedMove.product.uom}</strong></span>
                  <span>•</span>
                  <span>Unit Cost: <strong>₹{selectedMove.product.unitCost.toLocaleString('en-IN')}</strong></span>
                </div>
              </div>

              {/* Movement Impact Card */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Movement Impact
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Quantity Transacted:</span>
                  <span
                    className={`text-lg font-mono font-bold ${
                      selectedMove.direction === 'IN' || (selectedMove.direction === 'ADJUSTMENT' && selectedMove.signedQuantity >= 0)
                        ? 'text-emerald-600'
                        : selectedMove.direction === 'OUT' || (selectedMove.direction === 'ADJUSTMENT' && selectedMove.signedQuantity < 0)
                        ? 'text-rose-600'
                        : 'text-indigo-600'
                    }`}
                  >
                    {selectedMove.signedQuantity >= 0 ? `+${selectedMove.quantity}` : `-${selectedMove.quantity}`}{' '}
                    {selectedMove.product.uom}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-sm text-slate-600">Total Value Impact:</span>
                  <span className="text-sm font-mono font-semibold text-slate-800">
                    ₹{(selectedMove.quantity * selectedMove.product.unitCost).toLocaleString('en-IN', {
                      minimumFractionDigits: 2
                    })}
                  </span>
                </div>
              </div>

              {/* Route: From -> To */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Stock Route
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[11px] text-slate-400">Source Location</div>
                    <div className="font-mono text-xs font-semibold text-slate-800 mt-1">
                      {selectedMove.fromLocation.fullPath}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Type: {selectedMove.fromLocation.type}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="text-[11px] text-slate-400">Destination Location</div>
                    <div className="font-mono text-xs font-semibold text-slate-800 mt-1">
                      {selectedMove.toLocation.fullPath}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Type: {selectedMove.toLocation.type}
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsible & Operation */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Audit Trace
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Contact / Partner:</span>
                  <span className="font-medium text-slate-800">
                    {selectedMove.operation?.contact || 'Internal'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Responsible User:</span>
                  <span className="font-medium text-slate-800">
                    {selectedMove.user?.name || selectedMove.operation?.responsible?.name || 'System'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Ledger Entry Id:</span>
                  <span className="font-mono text-slate-400 truncate max-w-[200px]">
                    {selectedMove.id}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            {selectedMove.operation && (
              <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                <Link
                  to={
                    selectedMove.operation.type === 'RECEIPT'
                      ? `/operations/receipts/${selectedMove.operation.id}`
                      : selectedMove.operation.type === 'DELIVERY'
                      ? `/operations/deliveries/${selectedMove.operation.id}`
                      : selectedMove.operation.type === 'INTERNAL'
                      ? `/operations/transfers/${selectedMove.operation.id}`
                      : `/operations/adjustments/${selectedMove.operation.id}`
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Operation Document</span>
                </Link>
                <button
                  onClick={() => setSelectedMove(null)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        )}
      </Sheet>
    </div>
  );
};
