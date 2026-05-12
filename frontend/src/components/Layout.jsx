import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  BookOpen, LayoutDashboard, Building2, Users, Tag,
  FileText, BarChart3, LogOut, Menu, X, ChevronDown, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authAPI } from '../api/client';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['super_admin', 'society_admin', 'editor', 'viewer', 'auditor'] },
  { to: '/societies', icon: Building2, label: 'Societies', roles: ['super_admin'] },
  { to: '/entries', icon: FileText, label: 'Entries', roles: ['super_admin', 'society_admin', 'editor', 'viewer'] },
  { to: '/headings', icon: Tag, label: 'Headings', roles: ['super_admin', 'society_admin'] },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['super_admin', 'society_admin', 'auditor'] },
  { to: '/users', icon: Users, label: 'Manage Users', roles: ['super_admin', 'society_admin'] },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, refreshToken, clearAuth, hasRole } = useAuthStore();
  const navigate = useNavigate();

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const handleLogout = async () => {
    try {
      await authAPI.logout(refreshToken);
    } catch {}
    clearAuth();
    toast.success('Logged out');
    navigate('/login');
  };

  const roleLabel = {
    super_admin: 'Super Admin',
    society_admin: 'Society Admin',
    editor: 'Editor',
    viewer: 'Viewer',
    auditor: 'Auditor',
  };

  return (
    <div className="flex h-screen bg-surface-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-primary-950 flex flex-col
        transform transition-transform duration-200 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-primary-800">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">Dainik Bahi</p>
            <p className="text-primary-400 text-xs">Samiti Ledger</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-primary-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-primary-300 hover:bg-primary-800/50 hover:text-white'
                }`
              }
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-primary-800">
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-primary-800/50 transition-colors"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-white text-sm font-medium truncate">{user?.name}</p>
                <p className="text-primary-400 text-xs">{roleLabel[user?.role]}</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-primary-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {userMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface-800 rounded-lg shadow-xl overflow-hidden">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-surface-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-white border-b border-surface-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-surface-700 hover:text-primary-600"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="font-display font-semibold text-primary-900">Dainik Bahi</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
