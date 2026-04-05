import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import AdminLayout from './components/layout/AdminLayout';
// Auth pages
import Login from './pages/auth/Login';

// Admin pages
import UserList from './pages/admin/UserList';
import TableManager from './pages/admin/TableManager';
import ReservationTracking from './pages/admin/ReservationTracking';
import CategoryManager from './pages/admin/CategoryManager';
import FoodManager from './pages/admin/FoodManager';
import InvoiceHistory from './pages/admin/InvoiceHistory';
import PromotionManager from './pages/admin/PromotionManager';
import POS from './pages/staff/POS';


function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-dark-500 text-sm font-medium">Đang khởi đông...</span>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={user ? <Navigate to={'/admin/tables'} replace /> : <Login />} />
      <Route path="/" element={<Navigate to={'/admin/tables'} replace />} />

      {/* Admin / Staff Dashboard */}
      <Route element={<ProtectedRoute allowedRoles={['MANAGER', 'STAFF']}><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin/tables" element={<TableManager />} />
        <Route path="/admin/reservations" element={<ReservationTracking />} />
        <Route path="/admin/users" element={<UserList />} />
        <Route path="/admin/categories" element={<CategoryManager />} />
        <Route path="/admin/foods" element={<FoodManager />} />
        <Route path="/admin/promotions" element={<PromotionManager />} />
        <Route path="/admin/invoices" element={<InvoiceHistory />} />
        <Route path="/staff/pos" element={<POS />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to={user ? '/admin/tables' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#1a1a1a',
              color: '#fff',
              fontSize: '14px',
              padding: '12px 16px',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
