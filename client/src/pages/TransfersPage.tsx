import React from 'react';
import { ArrowLeftRight, Plus, Search } from 'lucide-react';

export const TransfersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Internal Transfers</h1>
          <p className="text-sm text-slate-500 mt-0.5">Move inventory between warehouses and internal locations</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Transfer</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search transfers..."
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
                <th className="px-5 py-3.5">Source Location</th>
                <th className="px-5 py-3.5">Destination Location</th>
                <th className="px-5 py-3.5">Scheduled Date</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-indigo-600 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-500" />
                  <span>WH/INT/0001</span>
                </td>
                <td className="px-5 py-3.5 font-medium text-slate-800">WH/Stock1</td>
                <td className="px-5 py-3.5 font-medium text-slate-800">WH/ProductionFloor</td>
                <td className="px-5 py-3.5">2026-09-30</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    Draft
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 text-center">
          Internal transfer engine logic will be active in Stage 6.
        </div>
      </div>
    </div>
  );
};
