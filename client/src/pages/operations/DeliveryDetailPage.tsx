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
  AlertTriangle,
  AlertCircle,
  Plus,
  Trash2,
  Truck,
  CheckSquare,
  Square,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import axios from 'axios';
import { format } from 'date-fns';

export const DeliveryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Form State
  const [contact, setContact] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourceLocationId, setSourceLocationId] = useState('');
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
      setContact(operation.contact || '');
      setDeliveryAddress(operation.deliveryAddress || '');
      setScheduledDate(
        operation.scheduledDate
          ? new Date(operation.scheduledDate).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );
      setSourceLocationId(operation.sourceLocationId || '');
      setNotes(operation.notes || '');
      if (operation.lines && operation.lines.length > 0) {
        setLines(operation.lines.map((l) => ({ productId: l.productId, demandQty: l.demandQty })));
      }
    } else if (isNew && locations.length > 0 && !sourceLocationId) {
      setSourceLocationId(locations[0].id);
    }
  }, [operation, isNew, locations]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: createOperation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      navigate(`/operations/deliveries/${data.id}`, { replace: true });
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setErrorMessage(err.response.data.error);
      } else {
        setErrorMessage('Failed to create delivery order.');
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
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['operation', id] });
      queryClient.invalidateQueries({ queryKey: ['operations'] });
      if (res.isWaiting) {
        setErrorMessage(res.message);
      } else {
        setErrorMessage(null);
      }
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

  // Pick / Pack toggle handlers
  const handleTogglePicked = () => {
    if (!operation || isReadOnly) return;
    const newPickedAt = operation.pickedAt ? null : new Date().toISOString();
    updateMutation.mutate({ pickedAt: newPickedAt });
  };

  const handleTogglePacked = () => {
    if (!operation || isReadOnly) return;
    const newPackedAt = operation.packedAt ? null : new Date().toISOString();
    updateMutation.mutate({ packedAt: newPackedAt });
  };

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

    if (!sourceLocationId) {
      setErrorMessage('Please select a source storage location.');
      return;
    }

    if (isNew) {
      createMutation.mutate({
        type: 'DELIVERY',
        contact: contact.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        sourceLocationId,
        notes: notes.trim() || undefined,
        lines: validLines
      });
    } else {
      updateMutation.mutate({
        contact: contact.trim() || undefined,
        deliveryAddress: deliveryAddress.trim() || undefined,
        scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : undefined,
        sourceLocationId,
        notes: notes.trim() || undefined,
        lines: validLines
      });
    }
  };

  const isReadOnly = operation?.status === 'DONE' || operation?.status === 'CANCELED';
  const isPicked = Boolean(operation?.pickedAt);
  const isPacked = Boolean(operation?.packedAt);
  const canValidate = operation?.status === 'READY' && isPicked && isPacked;

  const deliverySteps = [
    { key: 'DRAFT' as const, label: 'Draft' },
    { key: 'WAITING' as const, label: 'Waiting' },
    { key: 'READY' as const, label: 'Ready' },
    { key: 'DONE' as const, label: 'Done' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground print:hidden">
        <button
          onClick={() => navigate('/operations/deliveries')}
          className="hover:text-foreground flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Deliveries</span>
        </button>
        <span>/</span>
        <span className="font-mono font-semibold text-foreground">
          {isNew ? 'New Delivery' : operation?.reference}
        </span>
      </div>

      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-primary flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {isNew ? 'New Delivery' : operation?.reference}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Outbound shipment dispatch to customer
            </p>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusStepper
            currentStatus={operation?.status || 'DRAFT'}
            steps={deliverySteps}
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
          ) : operation?.status === 'DRAFT' || operation?.status === 'WAITING' ? (
            <>
              <Button
                onClick={() => markToDoMutation.mutate()}
                disabled={markToDoMutation.isPending}
                className="gap-1.5 shadow-sm"
              >
                <span>Check Availability & To Do ▸</span>
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
                  if (window.confirm('Are you sure you want to cancel this delivery order?')) {
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
                disabled={!canValidate}
                title={
                  !canValidate
                    ? 'Complete the Pick and Pack steps before validating'
                    : 'Validate and deduct stock'
                }
                className="gap-1.5 shadow-sm bg-primary text-white"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Validate</span>
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  if (window.confirm('Are you sure you want to cancel this delivery order?')) {
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
              <span>Print Delivery Note</span>
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
            <span className="font-semibold">Delivery Dispatched & Validated.</span> Stock items
            have been debited from the source location and recorded in the Stock Ledger.
          </div>
        </div>
      )}

      {/* Waiting Warning Banner */}
      {operation?.status === 'WAITING' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-semibold">Waiting for Available Stock.</span> One or more items
            are short at the source storage location. When replenishment receipts or transfers
            arrive, this delivery will be automatically promoted to Ready.
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

      {/* Pick & Pack Checklist (Problem Statement & UIprompt Requirement) */}
      {!isNew && operation?.status !== 'DRAFT' && (
        <div className="p-4 rounded-xl border bg-card shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Warehouse Warehouse Processing Checklist (Pick → Pack)
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Both stages must be verified before the delivery order can be validated.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleTogglePicked}
              disabled={isReadOnly}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isPicked
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-muted/30 border-muted text-muted-foreground hover:border-primary'
              }`}
            >
              {isPicked ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>Picked {isPicked && '✓'}</span>
            </button>

            <button
              type="button"
              onClick={handleTogglePacked}
              disabled={isReadOnly}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isPacked
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-muted/30 border-muted text-muted-foreground hover:border-primary'
              }`}
            >
              {isPacked ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>Packed {isPacked && '✓'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Details Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-card rounded-xl border p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Delivery Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Customer / Contact
              </label>
              <Input
                type="text"
                placeholder="e.g. Acme Corp"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                disabled={isReadOnly}
              />
            </div>

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
                Source Storage Location *
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

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Delivery Address
              </label>
              <textarea
                rows={2}
                placeholder="e.g. 123 Industrial Way, Sector 4"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                disabled={isReadOnly}
                className="w-full px-3 py-2 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* Product Lines Section */}
        <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
              Products to Deliver
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
                  <th className="px-5 py-3.5 text-right">Available at Source</th>
                  <th className="px-5 py-3.5 text-right w-36">Delivery Qty</th>
                  {!isReadOnly && <th className="px-5 py-3.5 text-right w-16"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lines.map((line, idx) => {
                  const selectedProduct = stockItems.find((p) => p.id === line.productId);
                  const availInfo = operation?.lineAvailability?.find(
                    (a) => a.productId === line.productId
                  );
                  const isShort = availInfo?.isShort;

                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isShort
                          ? 'bg-rose-50/80 dark:bg-rose-950/20 border-l-4 border-l-rose-500'
                          : 'hover:bg-muted/30'
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        {isReadOnly ? (
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {isShort && (
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            )}
                            <span>{selectedProduct?.name || 'Product'}</span>
                            <span className="font-mono text-xs text-muted-foreground">
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
                      <td className="px-5 py-3.5 text-right font-mono text-xs font-semibold">
                        {availInfo ? (
                          <span
                            className={
                              isShort
                                ? 'text-rose-600 font-bold'
                                : 'text-emerald-600'
                            }
                          >
                            {availInfo.onHand} on hand ({availInfo.freeToUse} free)
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isReadOnly ? (
                          <span
                            className={`font-mono font-bold ${
                              isShort ? 'text-rose-600' : 'text-foreground'
                            }`}
                          >
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
          <DialogTitle>Validate {operation?.reference}?</DialogTitle>
          <DialogDescription>
            Validating will deduct stock from the source location, complete the delivery, and write
            immutable ledger move records.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 p-4 rounded-xl bg-muted/40 border space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
            Stock Impact Preview:
          </span>
          {lines.map((l, idx) => {
            const p = stockItems.find((item) => item.id === l.productId);
            const loc = locations.find((loc) => loc.id === sourceLocationId);
            return (
              <div key={idx} className="flex items-center justify-between text-xs font-medium">
                <span>
                  {p?.name} [{p?.sku}]
                </span>
                <span className="font-mono text-rose-700 font-bold">
                  −{l.demandQty} {p?.uom || 'units'} from {loc?.fullPath}
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
            className="bg-primary text-white"
          >
            {validateMutation.isPending ? 'Validating...' : 'Validate & Update Stock'}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
};
