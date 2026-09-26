import React from 'react';
import { MapPin, Plus } from 'lucide-react';

export const LocationsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Locations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Racks, rooms, shelves, and virtual stock locations</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Location</span>
        </button>
      </div>

      {/* Locations Table Mockup per 03-settings-location.svg */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Short Code</th>
                <th className="px-5 py-3.5">Warehouse</th>
                <th className="px-5 py-3.5">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>Main Stock Rack 1</span>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-800">Stock1</td>
                <td className="px-5 py-3.5 font-medium text-blue-700">Main Warehouse (WH)</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                    Internal
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Vendors / Suppliers</span>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-800">Vendor</td>
                <td className="px-5 py-3.5 text-slate-400">&mdash;</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                    Virtual Vendor
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-400 text-center">
          Location hierarchy & path resolution will be active in Stage 3.
        </div>
      </div>
    </div>
  );
};
