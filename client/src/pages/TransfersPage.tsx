import React from 'react';
import { OperationsListView } from '@/components/operations/OperationsListView';

export const TransfersPage: React.FC = () => {
  return (
    <OperationsListView
      type="INTERNAL"
      title="Internal Transfers"
      description="Move inventory between warehouses, production racks, and storage shelves"
      createPath="/operations/transfers/new"
      createButtonText="New Transfer"
      kanbanColumns={['DRAFT', 'READY', 'DONE', 'CANCELED']}
    />
  );
};
