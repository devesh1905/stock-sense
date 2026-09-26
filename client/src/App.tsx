import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { StockPage } from './pages/StockPage';
import { ReceiptsPage } from './pages/ReceiptsPage';
import { DeliveriesPage } from './pages/DeliveriesPage';
import { TransfersPage } from './pages/TransfersPage';
import { AdjustmentsPage } from './pages/AdjustmentsPage';
import { MoveHistoryPage } from './pages/MoveHistoryPage';
import { WarehousesPage } from './pages/WarehousesPage';
import { LocationsPage } from './pages/LocationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { NotFoundPage } from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="operations" element={<Navigate to="/operations/receipts" replace />} />
            <Route path="operations/receipts" element={<ReceiptsPage />} />
            <Route path="operations/deliveries" element={<DeliveriesPage />} />
            <Route path="operations/transfers" element={<TransfersPage />} />
            <Route path="operations/adjustments" element={<AdjustmentsPage />} />
            <Route path="move-history" element={<MoveHistoryPage />} />
            <Route path="settings" element={<Navigate to="/settings/warehouses" replace />} />
            <Route path="settings/warehouses" element={<WarehousesPage />} />
            <Route path="settings/locations" element={<LocationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
