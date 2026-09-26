import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStock,
  createProduct,
  adjustStockInline,
  fetchCategories,
  createCategory,
  fetchLocations,
  updateReorderRule,
  ProductStockRow
} from '../api/masterData';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  MapPin,
  X,
  Edit3
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetFooter } from '../components/ui/sheet';
import axios from 'axios';

export const StockPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals & Drawers state
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<ProductStockRow | null>(null);
  const [selectedProductForDrawer, setSelectedProductForDrawer] = useState<ProductStockRow | null>(null);

  // New Product Form State
  const [productName, setProductName] = useState('');
  const [productSku, setProductSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [uom, setUom] = useState('Units');
  const [unitCost, setUnitCost] = useState('0');
  const [initialStock, setInitialStock] = useState('0');
  const [initialLocationId, setInitialLocationId] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Inline Stock Adjust State
  const [adjustLocationId, setAdjustLocationId] = useState('');
  const [countedQty, setCountedQty] = useState<number>(0);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState<string | null>(null);

  // Reorder Rule State inside Drawer
  const [reorderMin, setReorderMin] = useState<number>(0);
  const [reorderMax, setReorderMax] = useState<number>(0);
  const [reorderSuccessMsg, setReorderSuccessMsg] = useState<string | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'locations' | 'reorder'>('locations');

  // Queries
  const { data: stockItems = [], isLoading } = useQuery({
    queryKey: ['stock', search, selectedCategory],
    queryFn: () =>
      fetchStock({
        search: search.trim() || undefined,
        categoryId: selectedCategory === 'ALL' ? undefined : selectedCategory
      })
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => fetchLocations({ type: 'INTERNAL' })
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setIsNewProductOpen(false);
      resetProductForm();
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError('Failed to create product.');
      }
    }
  });

  const createCatMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: (cat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategoryId(cat.id);
      setIsCreatingCategory(false);
      setNewCatName('');
    }
  });

  const adjustMutation = useMutation({
    mutationFn: adjustStockInline,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setAdjustSuccessMsg(res.message);
      setTimeout(() => {
        setIsAdjustOpen(false);
        setAdjustSuccessMsg(null);
        setSelectedProductForAdjust(null);
      }, 1000);
    },
    onError: (err: unknown) => {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        setAdjustError(err.response.data.error);
      } else {
        setAdjustError('Failed to adjust stock.');
      }
    }
  });

  const reorderRuleMutation = useMutation({
    mutationFn: (vars: { productId: string; minQty: number; maxQty: number }) =>
      updateReorderRule(vars.productId, { minQty: vars.minQty, maxQty: vars.maxQty }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      setReorderSuccessMsg('Reorder rules saved successfully.');
      setTimeout(() => setReorderSuccessMsg(null), 3000);
    }
  });

  const resetProductForm = () => {
    setProductName('');
    setProductSku('');
    setCategoryId('');
    setUom('Units');
    setUnitCost('0');
    setInitialStock('0');
    setInitialLocationId('');
    setFormError(null);
  };

  // Open inline adjust dialog
  const openAdjustDialog = (product: ProductStockRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedProductForAdjust(product);
    // Find initial location
    const defaultLocId =
      product.locations.length > 0 ? product.locations[0].locationId : locations[0]?.id || '';
    setAdjustLocationId(defaultLocId);

    const initialCurrentQty =
      product.locations.find((l) => l.locationId === defaultLocId)?.quantity || 0;
    setCountedQty(initialCurrentQty);
    setAdjustError(null);
    setAdjustSuccessMsg(null);
    setIsAdjustOpen(true);
  };

  // Open drawer
  const openDrawer = (product: ProductStockRow) => {
    setSelectedProductForDrawer(product);
    setReorderMin(product.reorderMin || 0);
    setReorderMax(product.reorderMax || 0);
    setActiveDrawerTab('locations');
  };

  // Handle location change in adjust dialog
  const currentRecordedQty = useMemo(() => {
    if (!selectedProductForAdjust || !adjustLocationId) return 0;
    const match = selectedProductForAdjust.locations.find((l) => l.locationId === adjustLocationId);
    return match ? match.quantity : 0;
  }, [selectedProductForAdjust, adjustLocationId]);

  const diffQty = countedQty - currentRecordedQty;

  // Filtered Stock Items
  const filteredStock = useMemo(() => {
    return stockItems.filter((item) => {
      if (statusFilter === 'ALL') return true;
      return item.stockStatus === statusFilter;
    });
  }, [stockItems, statusFilter]);

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['SKU', 'Product Name', 'Category', 'UoM', 'Unit Cost (INR)', 'On Hand', 'Free To Use', 'Status'];
    const rows = filteredStock.map((item) => [
      `"${item.sku}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.uom}"`,
      item.unitCost,
      item.onHand,
      item.freeToUse,
      item.stockStatus
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `stocksense-inventory-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: ProductStockRow['stockStatus']) => {
    switch (status) {
      case 'IN_STOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
            In Stock
          </span>
        );
      case 'LOW_STOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400">
            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
            Low Stock
          </span>
        );
      case 'OUT_OF_STOCK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-400">
            <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
            Out of Stock
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Products / Stock</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time on-hand stock levels, free-to-use allocations, and inline adjustments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
          <Button onClick={() => setIsNewProductOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </Button>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by product name, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5 text-right">Per Unit Cost</th>
                <th className="px-5 py-3.5 text-right">On Hand</th>
                <th className="px-5 py-3.5 text-right">Free to Use</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4"><div className="h-4 w-40 bg-muted rounded" /></td>
                    <td className="px-5 py-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-4 w-16 bg-muted rounded ml-auto" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-4 w-12 bg-muted rounded ml-auto" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-4 w-12 bg-muted rounded ml-auto" /></td>
                    <td className="px-5 py-4 text-center"><div className="h-4 w-20 bg-muted rounded mx-auto" /></td>
                    <td className="px-5 py-4 text-right"><div className="h-4 w-16 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredStock.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium text-foreground">No products found</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {search || selectedCategory !== 'ALL' || statusFilter !== 'ALL'
                        ? 'Try clearing or changing your filters'
                        : 'Add your first product to begin tracking inventory'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredStock.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => openDrawer(item)}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-3.5 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span className="font-mono text-xs text-muted-foreground">[{item.sku}]</span>
                            <span>{item.name}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">UoM: {item.uom}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums text-foreground">
                      ₹{item.unitCost.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums font-bold text-foreground">
                      {item.onHand}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono tabular-nums font-bold text-emerald-600">
                      {item.freeToUse}
                    </td>
                    <td className="px-5 py-3.5 text-center">{getStatusBadge(item.stockStatus)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => openAdjustDialog(item, e)}
                        className="text-xs font-medium h-7 px-2.5 hover:border-primary hover:text-primary"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Update Stock
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-muted/20 border-t text-xs text-muted-foreground flex items-center justify-between">
          <span>Showing {filteredStock.length} items</span>
          <span>Click any product row to view locations ledger and reorder thresholds</span>
        </div>
      </div>

      {/* New Product Dialog */}
      <Dialog open={isNewProductOpen} onOpenChange={setIsNewProductOpen}>
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Register an inventory item with cost, category, and initial location stock.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {formError}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!productName.trim() || !productSku.trim()) {
              setFormError('Product Name and SKU are required.');
              return;
            }
            createProductMutation.mutate({
              name: productName.trim(),
              sku: productSku.trim().toUpperCase(),
              categoryId: categoryId || undefined,
              uom,
              unitCost: parseFloat(unitCost) || 0,
              initialStock: parseFloat(initialStock) || 0,
              initialLocationId: initialLocationId || undefined
            });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Product Name *
              </label>
              <Input
                type="text"
                placeholder="e.g. Steel Rods 10mm"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                SKU *
              </label>
              <Input
                type="text"
                placeholder="e.g. STEEL-001"
                value={productSku}
                onChange={(e) => setProductSku(e.target.value.toUpperCase())}
                className="font-mono uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-foreground uppercase tracking-wider">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                  className="text-xs text-primary font-medium hover:underline"
                >
                  {isCreatingCategory ? 'Cancel' : '+ New'}
                </button>
              </div>

              {isCreatingCategory ? (
                <div className="flex gap-1.5">
                  <Input
                    type="text"
                    placeholder="New category name"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="h-9 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newCatName.trim() || createCatMutation.isPending}
                    onClick={() => createCatMutation.mutate({ name: newCatName.trim() })}
                  >
                    Add
                  </Button>
                </div>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Unit of Measure (UoM)
              </label>
              <select
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              >
                <option value="Units">Units</option>
                <option value="kg">kg (Kilograms)</option>
                <option value="m">m (Meters)</option>
                <option value="L">L (Liters)</option>
                <option value="box">box (Boxes)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Per Unit Cost (₹)
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Initial Stock Qty
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={initialStock}
                onChange={(e) => setInitialStock(e.target.value)}
              />
            </div>
          </div>

          {parseFloat(initialStock) > 0 && (
            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Initial Storage Location *
              </label>
              <select
                value={initialLocationId}
                onChange={(e) => setInitialLocationId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select location...</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.fullPath})
                  </option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewProductOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createProductMutation.isPending}>
              {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Inline Stock Adjustment Modal Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogHeader>
          <DialogTitle>Inline Stock Adjustment</DialogTitle>
          <DialogDescription>
            Record physical count for <span className="font-semibold text-foreground">{selectedProductForAdjust?.name}</span> ({selectedProductForAdjust?.sku}).
          </DialogDescription>
        </DialogHeader>

        {adjustError && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-xs text-destructive">
            {adjustError}
          </div>
        )}

        {adjustSuccessMsg && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{adjustSuccessMsg}</span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!selectedProductForAdjust || !adjustLocationId) return;
            adjustMutation.mutate({
              productId: selectedProductForAdjust.id,
              locationId: adjustLocationId,
              countedQty
            });
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
              Select Storage Location *
            </label>
            <select
              value={adjustLocationId}
              onChange={(e) => {
                const locId = e.target.value;
                setAdjustLocationId(locId);
                const rec =
                  selectedProductForAdjust?.locations.find((l) => l.locationId === locId)?.quantity || 0;
                setCountedQty(rec);
              }}
              className="w-full h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
              required
            >
              {locations.map((loc) => {
                const existingQty =
                  selectedProductForAdjust?.locations.find((l) => l.locationId === loc.id)?.quantity || 0;
                return (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.fullPath}) — Current: {existingQty}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted/30 border rounded-lg">
              <span className="text-xs text-muted-foreground uppercase font-semibold block mb-1">
                Recorded Qty
              </span>
              <span className="text-lg font-mono font-bold text-foreground">
                {currentRecordedQty}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                Counted Qty *
              </label>
              <Input
                type="number"
                min="0"
                step="any"
                value={countedQty}
                onChange={(e) => setCountedQty(parseFloat(e.target.value) || 0)}
                className="font-mono text-lg font-bold"
                required
              />
            </div>
          </div>

          {/* Computed Difference Preview */}
          <div
            className={`p-3 rounded-lg border text-sm flex items-center justify-between ${
              diffQty === 0
                ? 'bg-muted/30 text-muted-foreground'
                : diffQty > 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">Adjustment Impact:</span>
              <span className="font-mono font-bold">
                {diffQty > 0 ? `+${diffQty}` : diffQty}
              </span>
            </div>
            <span className="text-xs">
              {diffQty === 0
                ? 'No change'
                : diffQty > 0
                ? 'Inventory gain will be recorded'
                : 'Inventory loss will be recorded'}
            </span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdjustOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={adjustMutation.isPending || diffQty === 0}
            >
              {adjustMutation.isPending ? 'Applying...' : 'Apply Adjustment'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Product Detail Drawer Sheet */}
      <Sheet
        open={!!selectedProductForDrawer}
        onOpenChange={(open) => {
          if (!open) setSelectedProductForDrawer(null);
        }}
      >
        {selectedProductForDrawer && (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-primary font-bold">
                  {selectedProductForDrawer.sku}
                </span>
                <button
                  onClick={() => setSelectedProductForDrawer(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SheetTitle className="text-xl mt-1">{selectedProductForDrawer.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2">
                <span>Category: {selectedProductForDrawer.category}</span>
                <span>•</span>
                <span>Unit Cost: ₹{selectedProductForDrawer.unitCost.toLocaleString('en-IN')}</span>
              </SheetDescription>
            </SheetHeader>

            {/* Drawer Tabs */}
            <div className="flex border-b px-6 bg-muted/20">
              <button
                onClick={() => setActiveDrawerTab('locations')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                  activeDrawerTab === 'locations'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Stock by Location ({selectedProductForDrawer.locations.length})
              </button>
              <button
                onClick={() => setActiveDrawerTab('reorder')}
                className={`py-3 px-4 text-xs font-semibold border-b-2 transition-all ${
                  activeDrawerTab === 'reorder'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Reordering Rules
              </button>
            </div>

            <SheetContent>
              {activeDrawerTab === 'locations' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-muted/30 border rounded-xl">
                      <span className="text-xs text-muted-foreground font-medium block">Total On Hand</span>
                      <span className="text-2xl font-bold font-mono text-foreground">
                        {selectedProductForDrawer.onHand}
                      </span>
                    </div>
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium block">
                        Free to Use
                      </span>
                      <span className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">
                        {selectedProductForDrawer.freeToUse}
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-4">
                    Location Breakdown
                  </h4>

                  {selectedProductForDrawer.locations.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl border-dashed text-muted-foreground">
                      <MapPin className="w-6 h-6 mx-auto mb-2 opacity-40" />
                      <p className="text-xs font-medium">No stock stored in any location yet.</p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openAdjustDialog(selectedProductForDrawer)}
                        className="mt-3 text-xs"
                      >
                        Add Stock via Adjustment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedProductForDrawer.locations.map((loc) => {
                        const pct =
                          selectedProductForDrawer.onHand > 0
                            ? Math.round((loc.quantity / selectedProductForDrawer.onHand) * 100)
                            : 0;
                        return (
                          <div
                            key={loc.locationId}
                            className="p-3 border rounded-xl bg-card space-y-2"
                          >
                            <div className="flex items-center justify-between text-sm">
                              <div>
                                <span className="font-semibold text-foreground">{loc.locationName}</span>
                                <span className="font-mono text-xs text-muted-foreground ml-2">
                                  ({loc.fullPath})
                                </span>
                              </div>
                              <span className="font-mono font-bold text-foreground">
                                {loc.quantity} {selectedProductForDrawer.uom}
                              </span>
                            </div>
                            {/* Proportional visual bar */}
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeDrawerTab === 'reorder' && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Set minimum and maximum inventory thresholds. When stock falls below the minimum,
                    a low-stock alert is generated on the Dashboard.
                  </p>

                  {reorderSuccessMsg && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{reorderSuccessMsg}</span>
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      reorderRuleMutation.mutate({
                        productId: selectedProductForDrawer.id,
                        minQty: reorderMin,
                        maxQty: reorderMax
                      });
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                        Minimum Threshold (Alert Trigger)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={reorderMin}
                        onChange={(e) => setReorderMin(parseFloat(e.target.value) || 0)}
                        className="font-mono"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Stock below this value will flag the item as Low Stock.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-1">
                        Maximum Threshold (Capacity Target)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={reorderMax}
                        onChange={(e) => setReorderMax(parseFloat(e.target.value) || 0)}
                        className="font-mono"
                      />
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Target stock quantity when ordering replenishment receipts.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      disabled={reorderRuleMutation.isPending}
                      className="w-full"
                    >
                      {reorderRuleMutation.isPending ? 'Saving...' : 'Save Reordering Rule'}
                    </Button>
                  </form>
                </div>
              )}
            </SheetContent>

            <SheetFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openAdjustDialog(selectedProductForDrawer)}
                className="w-full gap-1.5"
              >
                <Edit3 className="w-4 h-4" />
                <span>Adjust Stock in Location</span>
              </Button>
            </SheetFooter>
          </>
        )}
      </Sheet>
    </div>
  );
};
