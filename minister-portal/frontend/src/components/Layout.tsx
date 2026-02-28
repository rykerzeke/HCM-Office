import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useState } from 'react';
import { Icons } from './icons';

const navItems = [
  { to: '/', label: 'Dashboard', icon: Icons.LayoutDashboard },
  { to: '/cases/new', label: 'New Case', icon: Icons.FilePlus2 },
  { to: '/cases', label: 'Track Cases', icon: Icons.FolderSearch },
  { to: '/reports', label: 'Reports', icon: Icons.BarChart3, adminOnly: true },
  { to: '/track', label: 'Public Tracking', icon: Icons.Globe },
  { to: '/settings', label: 'Settings', icon: Icons.Settings },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile drawer
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop toggle

  const filteredNav = navItems.filter(
    (item) => !item.adminOnly || user?.role === 'ADMIN'
  );

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Top Menu Bar ── */}
      <header className="fixed top-0 inset-x-0 h-16 glass z-50 flex items-center justify-between px-4 lg:px-6 border-b border-[var(--divider)]">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl glass-light transition-colors lg:hidden"
          >
            <Icons.Menu className="h-5 w-5" />
          </button>
          
          {/* Desktop Menu Toggle */}
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 rounded-xl text-surface-400 hover:text-primary-400 transition-colors"
          >
            <Icons.Menu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center glow-primary shrink-0">
              <Icons.Shield className="h-4 w-4 text-white" />
            </div>
            <div className={`hidden sm:block transition-all duration-300 ${isCollapsed ? 'lg:opacity-0 lg:w-0 overflow-hidden' : 'opacity-100'}`}>
              <h1 className="text-sm font-bold tracking-wide">MINISTER</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full glass-light text-surface-300 hover:text-white transition-all hover:scale-105"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Icons.Sun className="h-5 w-5" /> : <Icons.Moon className="h-5 w-5" />}
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-[var(--divider)]">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-semibold text-white">{user?.name}</p>
              <p className="text-[11px] text-surface-400 font-medium">{user?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-cyan/20 to-primary-500/20 border border-accent-cyan/20 flex items-center justify-center text-accent-cyan text-xs font-bold shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg text-surface-500 hover:text-rose-400 hover:bg-rose-400/10 transition-all shrink-0"
              title="Logout"
            >
              <Icons.LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16 w-full h-full">
        {/* ── Sidebar ── */}
        <aside
          className={`
            fixed inset-y-0 left-0 top-16 z-40 glass flex flex-col border-r border-[var(--divider)]
            transform transition-all duration-300 ease-in-out
            lg:relative lg:translate-x-0
            ${sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
            ${isCollapsed ? 'lg:w-[72px]' : 'lg:w-72'}
          `}
        >
          {/* Mobile Close Button */}
          <div className="flex items-center justify-end p-4 lg:hidden border-b border-[var(--divider)]">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-surface-400 hover:text-primary-400 transition-colors"
            >
              <Icons.X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  className={`
                    group flex items-center gap-4 px-3 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 whitespace-nowrap
                    ${isActive
                      ? 'glass-accent glow-primary'
                      : 'text-surface-400 hover:bg-[rgba(99,102,241,0.06)]'
                    }
                    ${isCollapsed ? 'lg:justify-center lg:px-0' : ''}
                  `}
                >
                  <Icon className={`h-[18px] w-[18px] transition-colors shrink-0 icon-3d ${isActive ? 'text-primary-400' : 'text-surface-500 group-hover:text-primary-400'}`} />
                  <span className={`transition-all duration-300 ${isCollapsed ? 'lg:hidden lg:opacity-0 lg:w-0' : 'opacity-100'}`}>
                    {item.label}
                  </span>
                  {isActive && !isCollapsed && <Icons.ChevronRight className="ml-auto h-4 w-4 text-primary-400/60" />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* ── Overlay ── */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 top-16 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent p-6 lg:p-8 animate-fade-in relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
};
