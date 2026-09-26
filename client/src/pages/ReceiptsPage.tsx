import React from 'react';
import { OperationsListView } from '@/components/operations/OperationsListView';

export const ReceiptsPage: React.FC = () => {
  return (
    <OperationsListView
      type="RECEIPT"
      title="Receipts"
      description="Inbound stock arrivals from vendors and suppliers"
      createPath="/operations/receipts/new"
      createButtonText="New Receipt"
      kanbanColumns={['DRAFT', 'READY', 'DONE', 'CANCELED']}
    />
  );
};
