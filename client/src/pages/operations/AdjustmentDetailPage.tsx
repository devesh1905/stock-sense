import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchOperation } from '@/api/operations';
import { fetchStock, fetchLocations, adjustStockInline } from '@/api/masterData';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { format } from 'date-fns';

export const AdjustmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form State
  const [locationId, setLocationId] = useState('');
  const [productId, setProductId] = useState('');
  const [countedQty, setCountedQty] = useState<number>(0);
  const [reason, setReason] = useState('Count correction');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Queries
  const { data: operation } = useQuery({
    queryKey: ['operation', id],
    queryFn: () => fetchOperation(id!),
    enabled: !isNew
  });

  const { data: stockItems = [] } = useQuery({
    queryKey: ['stock'],
    queryFn: () => fetchStock()
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', 'INTERNAL'],
    queryFn: () => fetchLocations({ type: 'INTERNAL' })
  });

  // Default selection for new adjustment
  useEffect(() => {
    if (isNew) {
      if (locations.length > 0 && !locationId) {
        setLocationId(locations[0].id);
      }
      if (stockItems.length > 0 && !productId) {
        setProductId(stockItems[0].id);
      }
    }
  }, [isNew, locations, stockItems, locationId, productId]);

  // Find recorded quantity in the chosen location
  const selectedProduct = stockItems.find((p) => p.id === productId);
  const currentRecordedQty = useMemo(() => {
    if (!selectedProduct || !locationId) return 0;
    const match = selectedProduct.locations.find((l) => l.locationId === locationId);
    return match ? match.quantity : 0;
  }, [selectedProduct, locationId]);

  // Set initial counted quantity to match recorded quantity when product/location changes
  useEffect(() => {
    if (isNew && selectedProduct && locationId) {
      setCountedQty(currentRecordedQty);
    }
  }, [productId, locationId, currentRecordedQty, isNew]);

  const diffQty = countedQty - currentRecordedQty;

  const adjustMutation = useMutation({
    mutationFn: adjustStockInline,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setSuccessMessage(res.message);
      setTimeout(() => {
        navigate('/operations/adjustments');
      }, 1500);
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage('Failed to apply adjustment.');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!productId || !locationId) {
      setErrorMessage('Please select a product and storage location.');
      return;
    }

    if (diffQty === 0) {
      setErrorMessage('Counted quantity equals recorded quantity. No adjustment is needed.');
      return;
    }

    adjustMutation.mutate({
      productId,
      locationId,
      countedQty
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button
          onClick={() => navigate('/operations/adjustments')}
          className="hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Adjustments</span>
        </button>
        <span>/</span>
        <span className="font-mono font-semibold text-foreground">
          {isNew ? 'New Adjustment' : operation?.reference}
        </span>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {isNew ? 'New Inventory Adjustment' : operation?.reference}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reconcile physical counts, audit inventory loss/gain, and correct stock records
            </p>
          </div>
        </div>

        <div>
          {operation?.status && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              {operation.status}
            </span>
          )}
        </div>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {!isNew && operation && (
        <div className="p-4 rounded-xl bg-card border shadow-xs space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Adjustment Reference:</span>
            <span className="font-mono font-bold text-foreground">{operation.reference}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Date Logged:</span>
            <span>{format(new Date(operation.createdAt), 'dd MMM yyyy, HH:mm')}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Operator:</span>
            <span>{operation.responsible?.name || 'Operator'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Source / Target Location:</span>
            <span className="font-mono">{operation.sourceLocation?.fullPath || operation.destLocation?.fullPath}</span>
          </div>
        </div>
      )}

      {/* Form */}
      {isNew ? (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl border p-6 shadow-xs space-y-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Inventory Count Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Storage Location *
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                required
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.fullPath})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Product *
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                required
              >
                {stockItems.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    [{prod.sku}] {prod.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl border bg-muted/30">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider block mb-1">
                Current System Recorded Qty
              </span>
              <span className="text-2xl font-bold font-mono text-foreground">
                {currentRecordedQty} {selectedProduct?.uom || 'units'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Physical Counted Qty *
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={countedQty}
                onChange={(e) => setCountedQty(parseFloat(e.target.value) || 0)}
                className="font-mono text-xl font-bold h-14"
                required
              />
            </div>
          </div>

          {/* Difference Calculation Preview */}
          <div
            className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
              diffQty === 0
                ? 'bg-muted/30 text-muted-foreground'
                : diffQty > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold">Computed Impact:</span>
              <span className="font-mono font-bold text-lg">
                {diffQty > 0 ? `+${diffQty}` : diffQty} {selectedProduct?.uom || 'units'}
              </span>
            </div>
            <span className="text-xs font-medium">
              {diffQty === 0
                ? 'Counts match recorded quantity'
                : diffQty > 0
                ? 'Inventory gain will be credited'
                : 'Inventory loss / write-off will be debited'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Reason for Adjustment
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="Count correction">Count correction (Physical cycle count)</option>
                <option value="Damaged goods">Damaged / Expired goods</option>
                <option value="Lost / missing inventory">Lost / missing inventory</option>
                <option value="Found items">Found items</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Responsible Operator
              </label>
              <Input
                type="text"
                value={user?.name || 'Current User'}
                disabled
                className="bg-muted/40 cursor-not-allowed text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
              Internal Notes / Remarks
            </label>
            <Input
              type="text"
              placeholder="e.g. Audit conducted on Rack 2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/operations/adjustments')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={adjustMutation.isPending || diffQty === 0}
              className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Adjustment</span>
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
};
