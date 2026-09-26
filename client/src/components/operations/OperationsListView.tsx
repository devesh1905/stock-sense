import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchOperations, OperationType } from '@/api/operations';
import { STATUS_CONFIG, DocumentStatus } from '@/lib/status';
import {
  Plus,
  Search,
  LayoutList,
  Kanban,
  ArrowRight,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface OperationsListViewProps {
  type: OperationType;
  title: string;
  description: string;
  createPath: string;
  createButtonText: string;
  kanbanColumns: DocumentStatus[];
}

export const OperationsListView: React.FC<OperationsListViewProps> = ({
  type,
  title,
  description,
  createPath,
  createButtonText,
  kanbanColumns
}) => {
  const navigate = useNavigate();

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // View Mode: List | Kanban (remembered in localStorage)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => {
    return (localStorage.getItem(`stock_sense_view_${type}`) as 'list' | 'kanban') || 'list';
  });

  const handleViewModeChange = (mode: 'list' | 'kanban') => {
    setViewMode(mode);
    localStorage.setItem(`stock_sense_view_${type}`, mode);
  };

  const { data: operations = [], isLoading } = useQuery({
    queryKey: ['operations', type, search, statusFilter],
    queryFn: () =>
      fetchOperations({
        type,
        status: statusFilter === 'ALL' ? undefined : (statusFilter as DocumentStatus),
        search: search.trim() || undefined
      })
  });

  const filteredOperations = useMemo(() => {
    return operations.filter((op) => {
      if (statusFilter === 'ALL') return true;
      return op.status === statusFilter;
    });
  }, [operations, statusFilter]);

  const renderStatusBadge = (status: DocumentStatus, isLate?: boolean) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', config.badge)}>
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dot)} />
          {config.label}
        </span>
        {isLate && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 ring-1 ring-inset ring-red-200">
            LATE
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Button onClick={() => navigate(createPath)} className="gap-1.5 shadow-sm">
          <Plus className="w-4 h-4" />
          <span>{createButtonText}</span>
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by reference or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Status Filter Dropdown / Chips */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg border bg-card text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            {type === 'DELIVERY' && <option value="WAITING">Waiting</option>}
            <option value="READY">Ready</option>
            <option value="DONE">Done</option>
            <option value="CANCELED">Canceled</option>
          </select>

          {/* View Switch: List | Kanban */}
          <div className="inline-flex rounded-lg border bg-card p-1 shadow-xs">
            <button
              onClick={() => handleViewModeChange('list')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => handleViewModeChange('kanban')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors',
                viewMode === 'kanban'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        </div>
      </div>

      {/* View Mode: List */}
      {viewMode === 'list' ? (
        <div className="bg-card rounded-xl border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-foreground">
              <thead className="bg-muted/50 border-b text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-5 py-3.5">From</th>
                  <th className="px-5 py-3.5">To</th>
                  <th className="px-5 py-3.5">Contact</th>
                  <th className="px-5 py-3.5">Schedule Date</th>
                  <th className="px-5 py-3.5">Total Quantity</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-5 py-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-28 bg-muted rounded" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-12 bg-muted rounded" /></td>
                      <td className="px-5 py-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                      <td className="px-5 py-4 text-right"><div className="h-4 w-14 bg-muted rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredOperations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-muted-foreground">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-medium text-foreground">No operations found</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {search || statusFilter !== 'ALL'
                          ? 'Try clearing your search or status filter'
                          : `Create your first ${type.toLowerCase()} operation to get started`}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredOperations.map((op) => (
                    <tr
                      key={op.id}
                      onClick={() => navigate(`${createPath}/${op.id}`)}
                      className={cn(
                        'hover:bg-muted/40 transition-colors cursor-pointer group',
                        op.isLate && 'border-l-4 border-l-red-500'
                      )}
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-primary flex items-center gap-1.5">
                        <span>{op.reference}</span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">
                        {op.sourceLocation?.fullPath || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-foreground font-mono text-xs font-semibold">
                        {op.destLocation?.fullPath || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-foreground">
                        {op.contact || <span className="text-muted-foreground italic text-xs">None</span>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {op.scheduledDate ? (
                          <span className={cn(op.isLate && 'text-red-600 font-semibold')}>
                            {format(new Date(op.scheduledDate), 'dd MMM yyyy')}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs font-bold tabular-nums text-foreground">
                        {op.totalQty} units ({op.totalLines} lines)
                      </td>
                      <td className="px-5 py-3.5">{renderStatusBadge(op.status, op.isLate)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`${createPath}/${op.id}`);
                          }}
                          className="h-7 px-2.5 text-xs text-muted-foreground group-hover:text-primary"
                        >
                          <span>View</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View Mode: Kanban Board */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((colStatus) => {
            const colConfig = STATUS_CONFIG[colStatus] || STATUS_CONFIG.DRAFT;
            const colOps = filteredOperations.filter((op) => op.status === colStatus);

            return (
              <div
                key={colStatus}
                className="bg-card rounded-xl border shadow-xs overflow-hidden flex flex-col min-h-[400px]"
              >
                {/* Column Header */}
                <div className="p-3.5 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-2 h-2 rounded-full', colConfig.dot)} />
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {colConfig.label}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {colOps.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto max-h-[700px]">
                  {colOps.length === 0 ? (
                    <div className="p-8 text-center border rounded-lg border-dashed text-xs text-muted-foreground/60">
                      No documents
                    </div>
                  ) : (
                    colOps.map((op) => (
                      <div
                        key={op.id}
                        onClick={() => navigate(`${createPath}/${op.id}`)}
                        className={cn(
                          'p-3.5 rounded-lg border bg-card hover:border-primary hover:shadow-sm transition-all cursor-pointer space-y-2',
                          op.isLate && 'border-l-4 border-l-red-500'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-primary">
                            {op.reference}
                          </span>
                          {op.isLate && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                              LATE
                            </span>
                          )}
                        </div>

                        {op.contact && (
                          <div className="text-xs font-medium text-foreground truncate">
                            {op.contact}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                          <span>{op.totalQty} units</span>
                          {op.scheduledDate && (
                            <span>{format(new Date(op.scheduledDate), 'dd MMM')}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
