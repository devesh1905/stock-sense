import React from 'react';
import { OperationsListView } from '@/components/operations/OperationsListView';

export const AdjustmentsPage: React.FC = () => {
  return (
    <OperationsListView
      type="ADJUSTMENT"
      title="Stock Adjustments"
      description="Reconcile physical inventory counts with system records, audit damaged goods, and log adjustments"
      createPath="/operations/adjustments/new"
      createButtonText="New Adjustment"
      kanbanColumns={['DONE', 'DRAFT']}
    />
  );
};
