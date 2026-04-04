import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed, CalendarPlus, History, LogOut, User } from 'lucide-react';
import { useState } from 'react';

export default function CustomerLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-dark-50">
      {/* Navbar */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-dark-100 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between h-16 px-4 sm:px-6">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg group-hover:shadow-primary-500/40 transition-shadow">
              <UtensilsCrossed size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg text-dark-900 tracking-tight">Nhà Hàng</span>
          </NavLink>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/reservation/new"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'text-dark-600 hover:bg-dark-100 hover:text-dark-900'
                }`
              }
            >
              <CalendarPlus size={16} />
              Đặt bàn
            </NavLink>
            <NavLink
              to="/my-reservations"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/25'
                    : 'text-dark-600 hover:bg-dark-100 hover:text-dark-900'
                }`
              }
            >
              <History size={16} />
              Lịch sử đặt
            </NavLink>
          </nav>

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-dark-100 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-semibold text-sm shadow">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm font-medium text-dark-700">{user?.name}</span>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-2xl border border-dark-100 py-2 animate-scale-in z-50"
                onMouseLeave={() => setMenuOpen(false)}
              >
                <div className="px-4 py-2 border-b border-dark-100">
                  <p className="text-sm font-semibold text-dark-800">{user?.name}</p>
                  <p className="text-xs text-dark-400">{user?.email}</p>
                </div>
                {/* Mobile nav links */}
                <div className="md:hidden border-b border-dark-100 py-1">
                  <NavLink
                    to="/reservation/new"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-dark-600 hover:bg-dark-50"
                  >
                    <CalendarPlus size={15} /> Đặt bàn
                  </NavLink>
                  <NavLink
                    to="/my-reservations"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-dark-600 hover:bg-dark-50"
                  >
                    <History size={15} /> Lịch sử đặt
                  </NavLink>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-danger-500 hover:bg-danger-500/5 transition-colors cursor-pointer"
                >
                  <LogOut size={15} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-100 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-dark-400">
          <div className="flex items-center gap-2">
            <UtensilsCrossed size={14} className="text-primary-500" />
            <span>© 2026 Nhà Hàng. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-1">
            <User size={13} />
            <span>Xin chào, {user?.name}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
