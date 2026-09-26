import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchHealth } from '../api/client';
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
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { data: health, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 10000
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Inventory Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time inventory levels, pending operations, and system health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/operations/receipts"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Operation</span>
          </Link>
        </div>
      </div>

      {/* Backend & Database Health Status Banner (Stage 1 Verification) */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${health?.db ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900">Stage 1 Scaffold Status</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Ready
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-0.5">
                <span className="flex items-center gap-1">
                  API: {isLoading ? (
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
                  Database: {isLoading ? (
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
              </div>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
            <span>Ping API</span>
          </button>
        </div>
        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
            Error checking API health: {(error as Error).message}. Ensure server is running on :5000.
          </div>
        )}
      </div>

      {/* Mockup Dashboard Operation Cards (Receipt & Delivery Cards per Mockup 05-dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Receipt Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <ArrowDownToLine className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-slate-800">Receipts</h2>
            </div>
            <Link
              to="/operations/receipts"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="mt-4">
            <Link
              to="/operations/receipts"
              className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm shadow-xs transition-colors"
            >
              4 to receive
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span className="flex items-center gap-1 text-rose-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              1 Late
            </span>
            <span className="text-slate-500 font-medium">6 operations scheduled</span>
          </div>
        </div>

        {/* Delivery Card */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <ArrowUpFromLine className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-slate-800">Delivery Orders</h2>
            </div>
            <Link
              to="/operations/deliveries"
              className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              View all &rarr;
            </Link>
          </div>

          <div className="mt-4">
            <Link
              to="/operations/deliveries"
              className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-xs transition-colors"
            >
              4 to Deliver
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-rose-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                1 Late
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                2 waiting
              </span>
            </div>
            <span className="text-slate-500 font-medium">6 operations scheduled</span>
          </div>
        </div>
      </div>

      {/* PS KPI Cards */}
      <div>
        <h2 className="text-sm font-semibold tracking-wider uppercase text-slate-500 mb-3">
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white rounded-xl border border-slate-200/90 p-3.5">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Package className="w-4 h-4 text-blue-500" />
              <span>In Stock</span>
            </div>
            <div className="text-xl font-bold text-slate-900 mt-2">1,248</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across all locations</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-3.5">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Low / Out</span>
            </div>
            <div className="text-xl font-bold text-amber-600 mt-2">3</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Below reorder min</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-3.5">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <ArrowDownToLine className="w-4 h-4 text-emerald-500" />
              <span>Pending In</span>
            </div>
            <div className="text-xl font-bold text-emerald-600 mt-2">4</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Draft / Ready</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-3.5">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <ArrowUpFromLine className="w-4 h-4 text-blue-500" />
              <span>Pending Out</span>
            </div>
            <div className="text-xl font-bold text-blue-600 mt-2">4</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Waiting / Ready</div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
              <span>Transfers</span>
            </div>
            <div className="text-xl font-bold text-indigo-600 mt-2">2</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Scheduled internal</div>
          </div>
        </div>
      </div>
    </div>
  );
};
