import React from 'react';
import { DocumentStatus } from '@/lib/status';
import { Check, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatusStepperProps {
  currentStatus: DocumentStatus;
  steps: Array<{ key: DocumentStatus; label: string }>;
  className?: string;
}

export const StatusStepper: React.FC<StatusStepperProps> = ({ currentStatus, steps, className }) => {
  if (currentStatus === 'CANCELED') {
    return (
      <div className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold', className)}>
        <XCircle className="w-4 h-4 text-rose-500" />
        <span>Document Canceled</span>
      </div>
    );
  }

  const currentIndex = steps.findIndex((s) => s.key === currentStatus);

  return (
    <div className={cn('inline-flex items-center rounded-lg border bg-card p-1 shadow-xs', className)}>
      {steps.map((step, idx) => {
        const isCompleted = idx < currentIndex || currentStatus === 'DONE';
        const isCurrent = step.key === currentStatus && currentStatus !== 'DONE';
        const isFuture = idx > currentIndex && currentStatus !== 'DONE';

        return (
          <React.Fragment key={step.key}>
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors',
                isCurrent && 'bg-primary text-primary-foreground shadow-xs',
                isCompleted && 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30',
                isFuture && 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isCompleted ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : isCurrent ? (
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
              )}
              <span>{step.label}</span>
            </div>

            {idx < steps.length - 1 && (
              <span className="text-muted-foreground/30 px-1 font-mono select-none">›</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
