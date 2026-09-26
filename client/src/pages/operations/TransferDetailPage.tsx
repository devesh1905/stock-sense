import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOperation,
  createOperation,
  updateOperation,
  markOperationToDo,
  validateOperationApi,
  cancelOperationApi
} from '@/api/operations';
import { fetchStock, fetchLocations } from '@/api/masterData';
import { useAuth } from '@/context/AuthContext';
import { StatusStepper } from '@/components/operations/StatusStepper';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ArrowLeftRight,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import axios from 'axios';
import { format } from 'date-fns';

export const TransferDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form State
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourceLocationId, setSourceLocationId] = useState('');
  const [destLocationId, setDestLocationId] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Array<{ productId: string; demandQty: number }>>([
    { productId: '', demandQty: 1 }
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isValidateDialogOpen, setIsValidateDialogOpen] = useState(false);

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

  useEffect(() => {
    if (operation) {
      setScheduledDate(
        operation.scheduledDate
          ? new Date(operation.scheduledDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setSourceLocationId(operation.sourceLocationId || '');
      setDestLocationId(operation.destLocationId || '');
      setNotes(operation.notes || '');
      if (operation.lines && operation.lines.length > 0) {
        setLines(operation.lines.map((l) => ({ productId: l.productId, demandQty: l.demandQty })));
      }
    } else if (isNew && locations.length >= 2 && !sourceLocationId) {
      setSourceLocationId(locations[0].id);
      setDestLocationId(locations[1].id);
    }
  }, [operation, isNew, locations]);

  // Swap Locations Handler
  const handleSwapLocations = () => {
    if (isReadOnly) return;
    const temp = sourceLocationId;
    setSourceLocationId(destLocationId);
    setDestLocationId(temp);
  };

  // Mutations
  const createMutation = useMutation({
    mutationFn: createOperation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      navigate(`/operations/transfers/${data.id}`, { replace: true });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage('Failed to create transfer.');
      }
    }
  });

  const updateMutation = useMutation({
    mutationFn: (payload: any) => updateOperation(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      }
    }
  });

  const markToDoMutation = useMutation({
    mutationFn: () => markOperationToDo(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      setErrorMessage(null);
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      }
    }
  });

  const validateMutation = useMutation({
    mutationFn: () => validateOperationApi(id!),
    onSuccess: () => {
      setIsValidateDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      queryClient.invalidateQueries({ queryKey: ['stock'] });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      }
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOperationApi(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
    }
  });

  // Line helpers
  const handleAddLine = () => {
    setLines([...lines, { productId: stockItems[0]?.id || '', demandQty: 1 }]);
  };

  const handleRemoveLine = (idx: number) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const handleLineProductChange = (idx: number, productId: string) => {
    const updated = [...lines];
    updated[idx].productId = productId;
    setLines(updated);
  };

  const handleLineQtyChange = (idx: number, qty: number) => {
    const updated = [...lines];
    updated[idx].demandQty = qty;
    setLines(updated);
  };

  const totalQuantity = lines.reduce((acc, l) => acc + (l.demandQty || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validLines = lines.filter((l) => l.productId && l.demandQty > 0);
    if (validLines.length === 0) {
      setErrorMessage('Please add at least one product with quantity > 0.');
      return;
    }

    if (!sourceLocationId || !destLocationId) {
      setErrorMessage('Please select both source and destination storage locations.');
      return;
    }

    if (sourceLocationId === destLocationId) {
      setErrorMessage('Source and destination locations cannot be the same.');
      return;
    }

    if (isNew) {
      createMutation.mutate({
        type: 'INTERNAL',
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        sourceLocationId,
        destLocationId,
        notes: notes.trim() || undefined,
        lines: validLines
      });
    } else {
      updateMutation.mutate({
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        sourceLocationId,
        destLocationId,
        notes: notes.trim() || undefined,
        lines: validLines
      });
    }
  };

  const isReadOnly = operation?.status === 'DONE' || operation?.status === 'CANCELED';

  const transferSteps = [
    { key: 'DRAFT' as const, label: 'Draft' },
    { key: 'READY' as const, label: 'Ready' },
    { key: 'DONE' as const, label: 'Done' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground print:hidden">
        <button
          onClick={() => navigate('/operations/transfers')}
          className="hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Internal Transfers</span>
        </button>
        <span>/</span>
        <span className="font-mono font-semibold text-foreground">
          {isNew ? 'New Transfer' : operation?.reference}
        </span>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {isNew ? 'New Transfer' : operation?.reference}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Move inventory between storage locations, racks, and warehouse floors
            </p>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusStepper
            currentStatus={operation?.status || 'DRAFT'}
            steps={transferSteps}
          />
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex items-center justify-between gap-2 p-3 bg-card border rounded-xl shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          {isNew ? (
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending}
              className="gap-1.5 shadow-sm"
            >
              <span>Save as Draft</span>
            </Button>
          ) : operation?.status === 'DRAFT' ? (
            <>
              <Button
                onClick={() => markToDoMutation.mutate()}
                disabled={markToDoMutation.isPending}
                className="gap-1.5 shadow-sm"
              >
                <span>To Do ▸</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
              >
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel this transfer?')) {
                    cancelMutation.mutate();
                  }
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                Cancel
              </Button>
            </>
          ) : operation?.status === 'READY' ? (
            <>
              <Button
                onClick={() => setIsValidateDialogOpen(true)}
                className="gap-1.5 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Validate</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel this transfer?')) {
                    cancelMutation.mutate();
                  }
                }}
                className="text-muted-foreground hover:text-destructive"
              >
                Cancel
              </Button>
            </>
          ) : operation?.status === 'DONE' ? (
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Transfer Note</span>
            </Button>
          ) : null}
        </div>

        <div className="text-xs text-muted-foreground">
          {operation?.validatedAt && (
            <span>
              Validated on {format(new Date(operation.validatedAt), 'dd MMM yyyy, HH:mm')}
            </span>
          )}
        </div>
      </div>

      {/* Done Banner */}
      {operation?.status === 'DONE' && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-3">
          <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-semibold">Transfer Completed.</span> Stock moved from{' '}
            <span className="font-mono font-bold">{operation.sourceLocation?.fullPath}</span> to{' '}
            <span className="font-mono font-bold">{operation.destLocation?.fullPath}</span>. Total
            inventory remains unchanged.
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Details Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Transfer Locations & Schedule
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Source Location (From) *
              </label>
              <select
                value={sourceLocationId}
                onChange={(e) => setSourceLocationId(e.target.value)}
                disabled={isReadOnly}
                className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary disabled:opacity-60"
                required
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.fullPath})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-center pb-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSwapLocations}
                disabled={isReadOnly}
                className="h-9 w-9 p-0"
                title="Swap source and destination locations"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Destination Location (To) *
              </label>
              <select
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
                disabled={isReadOnly}
                className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary disabled:opacity-60"
                required
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.fullPath})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Schedule Date
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                disabled={isReadOnly}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Responsible Operator
              </label>
              <Input
                type="text"
                value={operation?.responsible?.name || user?.name || 'Current User'}
                disabled
                className="bg-muted/40 cursor-not-allowed text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Product Lines Section */}
        <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Products to Transfer
            </h2>
            <span className="text-xs font-mono font-bold text-muted-foreground">
              Total Units: {totalQuantity}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-5 py-3.5">Unit of Measure</th>
                  <th className="px-5 py-3.5 text-right w-36">Quantity</th>
                  {!isReadOnly && <th className="px-5 py-3.5 text-right w-16"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line, idx) => {
                  const selectedProduct = stockItems.find((p) => p.id === line.productId);
                  return (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="px-5 py-3.5">
                        {isReadOnly ? (
                          <div className="font-semibold text-foreground">
                            {selectedProduct?.name || 'Product'}
                            <span className="font-mono text-xs text-muted-foreground ml-2">
                              [{selectedProduct?.sku}]
                            </span>
                          </div>
                        ) : (
                          <select
                            value={line.productId}
                            onChange={(e) => handleLineProductChange(idx, e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                            required
                          >
                            <option value="">Select product...</option>
                            {stockItems.map((prod) => (
                              <option key={prod.id} value={prod.id}>
                                [{prod.sku}] {prod.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">
                        {selectedProduct?.uom || 'Units'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isReadOnly ? (
                          <span className="font-mono font-bold text-foreground">
                            {line.demandQty}
                          </span>
                        ) : (
                          <Input
                            type="number"
                            min="1"
                            step="any"
                            value={line.demandQty}
                            onChange={(e) =>
                              handleLineQtyChange(idx, parseFloat(e.target.value) || 0)
                            }
                            className="text-right font-mono font-bold w-28 ml-auto"
                            required
                          />
                        )}
                      </td>
                      {!isReadOnly && (
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLine(idx)}
                            disabled={lines.length === 1}
                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {!isReadOnly && (
            <div className="p-3 bg-muted/20 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLine}
                className="gap-1.5 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* Validate Confirmation Dialog */}
      <Dialog open={isValidateDialogOpen} onOpenChange={setIsValidateDialogOpen}>
        <DialogHeader>
          <DialogTitle>Validate Transfer {operation?.reference}?</DialogTitle>
          <DialogDescription>
            Validating will atomically move inventory items from the source location to the
            destination location. Total inventory quantity remains unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 rounded-xl bg-muted/40 border space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Movement Preview:
          </span>
          {lines.map((l, idx) => {
            const p = stockItems.find((item) => item.id === l.productId);
            const srcLoc = locations.find((loc) => loc.id === sourceLocationId);
            const dstLoc = locations.find((loc) => loc.id === destLocationId);
            return (
              <div key={idx} className="flex items-center justify-between text-xs font-medium">
                <span>
                  {p?.name} [{p?.sku}]
                </span>
                <span className="font-mono text-indigo-700 font-bold">
                  {l.demandQty} {p?.uom || 'units'} ({srcLoc?.fullPath} → {dstLoc?.fullPath})
                </span>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsValidateDialogOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {validateMutation.isPending ? 'Validating...' : 'Validate & Transfer Stock'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
