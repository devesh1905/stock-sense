export type DocumentStatus = 'DRAFT' | 'WAITING' | 'READY' | 'DONE' | 'CANCELED';

export interface StatusConfig {
  label: string;
  badge: string;
  dot: string;
  border: string;
  text: string;
}

export const STATUS_CONFIG: Record<DocumentStatus | 'LATE', StatusConfig> = {
  DRAFT: {
    label: 'Draft',
    badge: 'bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
    dot: 'bg-slate-400',
    border: 'border-slate-200 dark:border-slate-800',
    text: 'text-slate-700 dark:text-slate-300'
  },
  WAITING: {
    label: 'Waiting',
    badge: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-900',
    dot: 'bg-amber-500',
    border: 'border-amber-200 dark:border-amber-900',
    text: 'text-amber-700 dark:text-amber-400'
  },
  READY: {
    label: 'Ready',
    badge: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:ring-blue-900',
    dot: 'bg-blue-600',
    border: 'border-blue-200 dark:border-blue-900',
    text: 'text-blue-700 dark:text-blue-400'
  },
  DONE: {
    label: 'Done',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-900',
    dot: 'bg-emerald-600',
    border: 'border-emerald-200 dark:border-emerald-900',
    text: 'text-emerald-700 dark:text-emerald-400'
  },
  CANCELED: {
    label: 'Canceled',
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200 line-through dark:bg-rose-950/40 dark:text-rose-400 dark:ring-rose-900',
    dot: 'bg-rose-500',
    border: 'border-rose-200 dark:border-rose-900',
    text: 'text-rose-700 dark:text-rose-400'
  },
  LATE: {
    label: 'Late',
    badge: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 font-semibold dark:bg-red-950/40 dark:text-red-400 dark:ring-red-900',
    dot: 'bg-red-600',
    border: 'border-red-500',
    text: 'text-red-600 dark:text-red-400'
  }
};
