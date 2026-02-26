import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useState } from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  FolderSearch,
  BarChart3,
  Globe,
  LogOut,
  Menu,
  X,
  Shield,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/cases/new', label: 'New Case', icon: FilePlus2 },
  { to: '/cases', label: 'Track Cases', icon: FolderSearch },
  { to: '/reports', label: 'Reports', icon: BarChart3, adminOnly: true },
  { to: '/track', label: 'Public Tracking', icon: Globe },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredNav = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN'
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 w-72 glass flex flex-col
          transform transition-transform duration-300 ease-in-out
          lg:relative lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: '1px solid var(--divider)' }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center glow-primary">
            <Shield className="h-5 w-5 text-white icon-3d" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide">MINISTER</h1>
            <p className="text-[10px] font-medium text-primary-400 tracking-[0.2em] uppercase">Office Portal</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto lg:hidden text-surface-400 hover:text-primary-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`
                  group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${isActive
                    ? 'glass-accent glow-primary'
                    : 'text-surface-400 hover:bg-[rgba(99,102,241,0.06)]'
                  }
                `}
              >
                <Icon className={`h-[18px] w-[18px] transition-colors icon-3d ${isActive ? 'text-primary-400' : 'text-surface-500 group-hover:text-primary-400'}`} />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="ml-auto h-4 w-4 text-primary-400/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle + User */}
        <div className="px-4 pb-5 space-y-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl glass-light text-sm font-medium transition-all hover:scale-[1.01]"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="h-4 w-4 text-primary-400" /> : <Sun className="h-4 w-4 text-amber-400" />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-primary-600' : 'bg-amber-400'}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'left-0.5' : 'left-5'}`} />
            </div>
          </button>

          {/* User Card */}
          <div className="glass-light rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-cyan/20 to-primary-500/20 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan text-xs font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{user?.name}</p>
                <p className="text-[11px] text-surface-400 font-medium">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-surface-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl glass transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary-400 icon-3d" />
            <span className="text-sm font-bold">Minister's Office</span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};
