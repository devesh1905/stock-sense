import React from 'react';
import { Building2, Plus } from 'lucide-react';

export const WarehousesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warehouses</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage storage facilities and physical warehouses</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Warehouse</span>
        </button>
      </div>

      {/* Warehouses Table Mockup per 01-settings-warehouse.svg */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Short Code</th>
                <th className="px-5 py-3.5">Address</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Main Warehouse</span>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs font-semibold text-blue-700">WH</td>
                <td className="px-5 py-3.5 text-slate-500">Plot 12, Industrial Area, Sector 5</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                    Active
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 text-center">
          Warehouse CRUD and short-code configuration will be active in Stage 3.
        </div>
      </div>
    </div>
  );
};
