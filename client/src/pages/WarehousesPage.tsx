import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWarehouses, createWarehouse, deleteWarehouse } from '../api/masterData';
import { Building2, Plus, Trash2, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import axios from 'axios';

export const WarehousesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: warehouses = [], isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['warehouses'],
    queryFn: fetchWarehouses
  });

  const createMutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsDialogOpen(false);
      setName('');
      setShortCode('');
      setAddress('');
      setError(null);
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to create warehouse.');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortCode.trim()) {
      setError('Please provide a warehouse name and short code.');
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      shortCode: shortCode.trim().toUpperCase(),
      address: address.trim() || undefined
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Warehouses</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage physical storage facilities, short codes, and facility addresses
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>New Warehouse</span>
        </Button>
      </div>

      {/* Warehouse Modal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogHeader>
          <DialogTitle>Add New Warehouse</DialogTitle>
          <DialogDescription>
            Create a storage facility. A default Stock1 internal location will be automatically provisioned.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Warehouse Name
            </label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Central Warehouse"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Short Code <span className="text-slate-400 font-normal">(2–6 uppercase characters)</span>
            </label>
            <Input
              required
              maxLength={6}
              value={shortCode}
              onChange={(e) => setShortCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="e.g. CW"
              className="font-mono uppercase"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Used as the prefix for all internal references (e.g. {shortCode || 'WH'}/IN/0001).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Address (Optional)
            </label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Industrial Area 4, Building B"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Warehouse'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Warehouses Table (Mockup 01-settings-warehouse.svg) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-400">Loading warehouses...</div>
        ) : queryError ? (
          <div className="p-6 text-center text-sm text-rose-600">
            Error loading warehouses. <button onClick={() => refetch()} className="underline ml-1">Retry</button>
          </div>
        ) : warehouses.length === 0 ? (
          <div className="py-12 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No warehouses configured</p>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">Add your first warehouse facility to start organizing stock locations.</p>
            <Button onClick={() => setIsDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Warehouse
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Short Code</th>
                  <th className="px-5 py-3.5">Address</th>
                  <th className="px-5 py-3.5">Locations</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {warehouses.map((wh) => (
                  <tr key={wh.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900 flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span>{wh.name}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-blue-700">
                      <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200/80">
                        {wh.shortCode}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{wh.address || '—'}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      <span className="inline-flex items-center gap-1 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {wh._count?.locations || 0} locations
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to deactivate ${wh.name}?`)) {
                            deleteMutation.mutate(wh.id);
                          }
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Deactivate Warehouse"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
