import React from 'react';
import { ArrowUpFromLine, Plus, Search, Filter } from 'lucide-react';

export const DeliveriesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Delivery Orders</h1>
          <p className="text-sm text-slate-500 mt-0.5">Outbound shipments to customers</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Delivery</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reference or contact..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Deliveries Table Mockup per 07-delivery-list.svg */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">From</th>
                <th className="px-5 py-3.5">To</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">Schedule date</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-blue-600 flex items-center gap-1.5">
                  <ArrowUpFromLine className="w-4 h-4 text-blue-500" />
                  <span>WH/OUT/0001</span>
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-800">WH/Stock1</td>
                <td className="px-5 py-3.5 text-slate-500">Customer</td>
                <td className="px-5 py-3.5">Azure Interior</td>
                <td className="px-5 py-3.5">2026-09-29</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Ready
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 text-center">
          Interactive Pick &rarr; Pack &rarr; Validate flows will be active in Stage 5.
        </div>
      </div>
    </div>
  );
};
