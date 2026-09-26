import React from 'react';
import { Search, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export const MoveHistoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Move History</h1>
          <p className="text-sm text-slate-500 mt-0.5">Immutable audit ledger of all product stock movements</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by reference, contact, or SKU..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table Mockup per 04-move-history.svg */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Contact</th>
                <th className="px-5 py-3.5">From</th>
                <th className="px-5 py-3.5">To</th>
                <th className="px-5 py-3.5">Quantity</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {/* In move: Green */}
              <tr className="hover:bg-emerald-50/40 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-blue-600">WH/IN/0001</td>
                <td className="px-5 py-3.5 text-slate-500">2026-09-26</td>
                <td className="px-5 py-3.5 font-sans text-slate-800">Azure Interior</td>
                <td className="px-5 py-3.5 text-slate-500">Vendor</td>
                <td className="px-5 py-3.5 font-medium text-slate-800">WH/Stock1</td>
                <td className="px-5 py-3.5 font-bold text-emerald-600 flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  +50 [DESK001]
                </td>
                <td className="px-5 py-3.5 font-sans">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                    Done
                  </span>
                </td>
              </tr>
              {/* Out move: Red */}
              <tr className="hover:bg-rose-50/40 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-blue-600">WH/OUT/0001</td>
                <td className="px-5 py-3.5 text-slate-500">2026-09-26</td>
                <td className="px-5 py-3.5 font-sans text-slate-800">Azure Interior</td>
                <td className="px-5 py-3.5 font-medium text-slate-800">WH/Stock1</td>
                <td className="px-5 py-3.5 text-slate-500">Customer</td>
                <td className="px-5 py-3.5 font-bold text-rose-600 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  -5 [DESK001]
                </td>
                <td className="px-5 py-3.5 font-sans">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                    Done
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 text-center font-sans">
          Stock ledger queries, color-coded rows, and pagination will be active in Stage 7.
        </div>
      </div>
    </div>
  );
};
