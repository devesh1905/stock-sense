import React from 'react';
import { Package, Plus, Search } from 'lucide-react';

export const StockPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Products / Stock</h1>
          <p className="text-sm text-slate-500 mt-0.5">List of available stock and free-to-use quantities</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Product</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by product name or SKU..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table mockup per 02-stock.svg */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Per unit cost</th>
                <th className="px-5 py-3.5">On hand</th>
                <th className="px-5 py-3.5">Free to use</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-medium text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span>[DESK001] Desk</span>
                </td>
                <td className="px-5 py-3.5">₹ 3,000</td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">50</td>
                <td className="px-5 py-3.5 font-semibold text-emerald-600">45</td>
                <td className="px-5 py-3.5 text-right">
                  <button className="text-xs font-medium text-blue-600 hover:text-blue-800">Update Stock</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-medium text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span>[TBL002] Table</span>
                </td>
                <td className="px-5 py-3.5">₹ 3,000</td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">50</td>
                <td className="px-5 py-3.5 font-semibold text-emerald-600">50</td>
                <td className="px-5 py-3.5 text-right">
                  <button className="text-xs font-medium text-blue-600 hover:text-blue-800">Update Stock</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 text-center">
          Full stock table and inline adjustment will be active in Stage 3.
        </div>
      </div>
    </div>
  );
};
