import React from 'react';
import { OperationsListView } from '@/components/operations/OperationsListView';

export const DeliveriesPage: React.FC = () => {
  return (
    <OperationsListView
      type="DELIVERY"
      title="Delivery Orders"
      description="Outbound customer shipments, picking, packing, and validation"
      createPath="/operations/deliveries/new"
      createButtonText="New Delivery"
      kanbanColumns={['DRAFT', 'WAITING', 'READY', 'DONE', 'CANCELED']}
    />
  );
};
