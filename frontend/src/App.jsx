import React from 'react';
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
} from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { PortalLayout } from './layouts/PortalLayout';
import { Logo } from './components/common/Logo';
import { ToastContainer } from './components/common/UIPrimitives';
import { WelcomePage } from './pages/WelcomePage';
import { Login } from './pages/auth/Login';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ServicesPage } from './pages/admin/ServicesPage';
import { StaffManagementPage } from './pages/admin/StaffManagementPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { InventoryPage } from './pages/admin/InventoryPage';
import { SettingsPage } from './pages/admin/SettingsPage';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffProfilePage } from './pages/staff/StaffProfilePage';
import { OrdersPage } from './pages/shared/OrdersPage';
import { OrderTrackingPage } from './pages/shared/OrderTrackingPage';
import { CustomersPage } from './pages/shared/CustomersPage';
import { PaymentsPage } from './pages/shared/PaymentsPage';
import { NewOrderPage } from './pages/shared/NewOrderPage';

const WorkspaceLoading = () => (
  <div className="min-h-screen bg-[#eef4ff] grid place-items-center px-6">
    <div className="bg-white border border-[#dce6fa] rounded-[16px] px-8 py-7 text-center shadow-[0_14px_40px_rgba(29,94,243,0.08)]">
      <div className="flex justify-center mb-4">
        <Logo />
      </div>
      <div className="w-6 h-6 border-2 border-[#1d5ef3] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-[13px] font-semibold text-[#5d6a85]">
        Loading Wash n&apos; Dash workspace...
      </p>
    </div>
  </div>
);

const ProtectedPortal = ({ allowedRole }) => {
  const { user, authLoading } = useApp();

  if (authLoading) {
    return <WorkspaceLoading />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== allowedRole) {
    return (
      <Navigate
        to={user.role === 'ADMIN' ? '/admin/dashboard' : '/staff/dashboard'}
        replace
      />
    );
  }

  return (
    <PortalLayout variant={allowedRole === 'ADMIN' ? 'admin' : 'staff'}>
      <Outlet />
    </PortalLayout>
  );
};

const RootRedirect = () => {
  const { user, authLoading } = useApp();
  if (authLoading) return <WorkspaceLoading />;
  if (!user) return <WelcomePage />;
  return (
    <Navigate
      to={user.role === 'ADMIN' ? '/admin/dashboard' : '/staff/dashboard'}
      replace
    />
  );
};

const AppShell = () => {
  const { toasts, dismissToast } = useApp();

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={<ProtectedPortal allowedRole="ADMIN" />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="orders" element={<OrdersPage mode="admin" />} />
          <Route path="orders/new" element={<NewOrderPage mode="admin" />} />
          <Route path="tracking" element={<OrderTrackingPage mode="admin" />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="staff" element={<StaffManagementPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/staff" element={<ProtectedPortal allowedRole="STAFF" />}>
          <Route index element={<Navigate to="/staff/dashboard" replace />} />
          <Route path="dashboard" element={<StaffDashboard />} />
          <Route path="orders" element={<OrdersPage mode="staff" />} />
          <Route path="orders/new" element={<NewOrderPage mode="staff" />} />
          <Route path="tracking" element={<OrderTrackingPage mode="staff" />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="profile" element={<StaffProfilePage />} />
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProvider>
  );
}
