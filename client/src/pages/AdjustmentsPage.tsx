import React from 'react';
import { SlidersHorizontal, Plus, Search } from 'lucide-react';

export const AdjustmentsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Stock Adjustments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Reconcile physical inventory counts with system records</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Adjustment</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search adjustments..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-hidden"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Location</th>
                <th className="px-5 py-3.5">Recorded Qty</th>
                <th className="px-5 py-3.5">Counted Qty</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-amber-600 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                  <span>WH/ADJ/0001</span>
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-800">[DESK001] Desk</td>
                <td className="px-5 py-3.5">WH/Stock1</td>
                <td className="px-5 py-3.5">50</td>
                <td className="px-5 py-3.5 font-semibold text-slate-900">48</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                    Done
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 text-center">
          Count reconciliation & adjustment engine logic will be active in Stage 6.
        </div>
      </div>
    </div>
  );
};
