import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  CalendarCheck,
  Users,
  Layers,
  Utensils,
  ShoppingCart,
  FileText,
  Tag,
  LogOut,
  ChevronLeft,
  Menu,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/staff/pos', label: 'Bán Hàng (POS)', icon: ShoppingCart, roles: ['MANAGER', 'STAFF'] },
  { to: '/admin/tables', label: 'Quản lý bàn', icon: LayoutDashboard, roles: ['MANAGER', 'STAFF'] },
  { to: '/admin/reservations', label: 'Đặt bàn', icon: CalendarCheck, roles: ['MANAGER', 'STAFF'] },
  { to: '/admin/categories', label: 'Danh mục món', icon: Layers, roles: ['MANAGER'] },
  { to: '/admin/foods', label: 'Thực đơn', icon: Utensils, roles: ['MANAGER'] },
  { to: '/admin/promotions', label: 'Khuyến mãi', icon: Tag, roles: ['MANAGER'] },
  { to: '/admin/invoices', label: 'Hóa đơn', icon: FileText, roles: ['MANAGER'] },
  { to: '/admin/users', label: 'Nhân sự', icon: Users, roles: ['MANAGER', 'STAFF'] },
];

export default function AdminLayout() {
  const { user, logout, isManager } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter(
    (item) => isManager || item.roles.includes('STAFF')
  );

  return (
    <div className="min-h-screen flex bg-dark-50">
      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-dark-950 text-white shadow-2xl
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[72px]' : 'w-[260px]'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-dark-800 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0 shadow-lg">
            <UtensilsCrossed size={18} className="text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-lg tracking-tight whitespace-nowrap animate-fade-in">
              Nhà Hàng
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-dark-300 hover:bg-dark-800 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
                `
              }
            >
              <item.icon size={20} className="shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 pb-4">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-dark-400 hover:bg-dark-800 hover:text-white transition-colors text-sm cursor-pointer"
          >
            <ChevronLeft
              size={18}
              className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            />
            {!collapsed && <span>Thu gọn</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          collapsed ? 'ml-[72px]' : 'ml-[260px]'
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-xl border-b border-dark-100 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-dark-500 hover:bg-dark-100 transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h2 className="text-lg font-semibold text-dark-800">Dashboard</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-dark-800 leading-tight">{user?.name}</p>
                <p className="text-xs text-dark-400">
                  {user?.role === 'MANAGER' ? 'Quản lý' : 'Nhân viên'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-dark-400 hover:bg-danger-500 hover:text-white transition-all duration-200 cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
