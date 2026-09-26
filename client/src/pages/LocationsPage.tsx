import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchLocations,
  fetchWarehouses,
  createLocation,
  deleteLocation,
  Location
} from '../api/masterData';
import {
  MapPin,
  Plus,
  Trash2,
  AlertCircle,
  Building2,
  Search,
  Filter
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import axios from 'axios';

export const LocationsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [type, setType] = useState<'INTERNAL' | 'VENDOR' | 'CUSTOMER' | 'ADJUSTMENT'>('INTERNAL');
  const [search, setSearch] = useState('');
  const [filterWarehouse, setFilterWarehouse] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: () => fetchLocations()
  });

  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: fetchWarehouses
  });

  const createMutation = useMutation({
    mutationFn: createLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setIsDialogOpen(false);
      setName('');
      setShortCode('');
      setWarehouseId('');
      setType('INTERNAL');
      setError(null);
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to create location.');
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setDeleteError(null);
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setDeleteError(err.response.data.error);
      } else {
        setDeleteError('Failed to delete location.');
      }
    }
  });

  const selectedWarehouse = warehouses.find((w) => w.id === warehouseId);
  const fullPathPreview = useMemo(() => {
    if (type !== 'INTERNAL') {
      return shortCode ? shortCode.toUpperCase() : 'VIRTUAL';
    }
    const whCode = selectedWarehouse ? selectedWarehouse.shortCode : 'WH';
    return `${whCode}/${shortCode ? shortCode.toUpperCase() : 'CODE'}`;
  }, [type, selectedWarehouse, shortCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortCode.trim()) {
      setError('Please provide a name and short code.');
      return;
    }
    if (type === 'INTERNAL' && !warehouseId) {
      setError('Internal locations must belong to a warehouse.');
      return;
    }
    createMutation.mutate({
      name: name.trim(),
      shortCode: shortCode.trim().toUpperCase(),
      warehouseId: type === 'INTERNAL' ? warehouseId : undefined,
      type
    });
  };

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesSearch =
        loc.name.toLowerCase().includes(search.toLowerCase()) ||
        loc.shortCode.toLowerCase().includes(search.toLowerCase()) ||
        loc.fullPath.toLowerCase().includes(search.toLowerCase());
      const matchesWarehouse =
        filterWarehouse === 'ALL' ||
        (filterWarehouse === 'VIRTUAL' ? !loc.warehouseId : loc.warehouseId === filterWarehouse);
      return matchesSearch && matchesWarehouse;
    });
  }, [locations, search, filterWarehouse]);

  const getTypeBadge = (locType: Location['type']) => {
    switch (locType) {
      case 'INTERNAL':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-950/40 dark:text-blue-400">
            Internal
          </span>
        );
      case 'VENDOR':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400">
            Virtual Vendor
          </span>
        );
      case 'CUSTOMER':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20 dark:bg-purple-950/40 dark:text-purple-400">
            Virtual Customer
          </span>
        );
      case 'ADJUSTMENT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400">
            Virtual Adjustment
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Locations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Internal storage racks, shelves, rooms, and virtual partner locations
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>New Location</span>
        </Button>
      </div>

      {deleteError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{deleteError}</span>
          </div>
          <button
            onClick={() => setDeleteError(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by location name, code, or full path..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <select
            value={filterWarehouse}
            onChange={(e) => setFilterWarehouse(e.target.value)}
            className="h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Warehouses & Virtual</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.shortCode})
              </option>
            ))}
            <option value="VIRTUAL">Virtual Locations Only</option>
          </select>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Name</th>
                <th className="px-5 py-3.5">Short Code</th>
                <th className="px-5 py-3.5">Full Path</th>
                <th className="px-5 py-3.5">Warehouse</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-32 bg-muted rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-4 w-8 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredLocations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-foreground">No locations found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search || filterWarehouse !== 'ALL'
                        ? 'Try clearing or changing your filters'
                        : 'Create your first location using the New Location button above'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-foreground flex items-center gap-2">
                      <MapPin
                        className={`w-4 h-4 shrink-0 ${
                          loc.type === 'INTERNAL'
                            ? 'text-primary'
                            : loc.type === 'VENDOR'
                            ? 'text-emerald-600'
                            : loc.type === 'CUSTOMER'
                            ? 'text-purple-600'
                            : 'text-amber-600'
                        }`}
                      />
                      <span>{loc.name}</span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-foreground">
                      {loc.shortCode}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-primary font-medium">
                      {loc.fullPath}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      {loc.warehouse ? (
                        <span className="flex items-center gap-1.5 font-medium text-foreground">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>
                            {loc.warehouse.name} ({loc.warehouse.shortCode})
                          </span>
                        </span>
                      ) : (
                        <span className="text-xs italic text-muted-foreground/60">System Virtual</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">{getTypeBadge(loc.type)}</td>
                    <td className="px-5 py-3.5 text-right">
                      {loc.type === 'INTERNAL' ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${loc.name}?`)) {
                              deleteMutation.mutate(loc.id);
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          title="Delete location"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground/60 italic">Fixed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Location Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogHeader>
          <DialogTitle>Add New Location</DialogTitle>
          <DialogDescription>
            Configure an internal rack, shelf, or staging area inside a warehouse.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
              Location Name *
            </label>
            <Input
              type="text"
              placeholder="e.g. Rack A1 - Floor Shelf"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Short Code *
              </label>
              <Input
                type="text"
                placeholder="e.g. RACK-A1"
                value={shortCode}
                onChange={(e) => setShortCode(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Location Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="INTERNAL">Internal Storage</option>
                <option value="VENDOR">Vendor (Virtual)</option>
                <option value="CUSTOMER">Customer (Virtual)</option>
                <option value="ADJUSTMENT">Adjustment (Virtual)</option>
              </select>
            </div>
          </div>

          {type === 'INTERNAL' && (
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Warehouse *
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.shortCode})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Full Path Live Preview */}
          <div className="p-3 bg-muted/30 border rounded-lg flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">Computed Full Path:</span>
            <span className="font-mono font-bold text-primary px-2 py-0.5 bg-card rounded border">
              {fullPathPreview}
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Location'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
};
