import { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Settings, 
  LogOut, 
  Menu,
  Activity,
  PlusCircle,
  Search
} from 'lucide-react';

export const Layout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Activity className="h-6 w-6 text-primary-600 mr-2" />
          <span className="font-bold text-lg text-gray-900">HCM Portal</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            <li>
              <NavLink to="/" className={({isActive}) => `flex items-center px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
                <LayoutDashboard className="h-5 w-5 mr-3" /> Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/cases/new" className={({isActive}) => `flex items-center px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
                <PlusCircle className="h-5 w-5 mr-3" /> New Case (Intake)
              </NavLink>
            </li>
            <li>
              <NavLink to="/cases" className={({isActive}) => `flex items-center px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
                <FileText className="h-5 w-5 mr-3" /> Track Cases
              </NavLink>
            </li>
            {user?.role === 'ADMIN' && (
              <li>
                <NavLink to="/reports" className={({isActive}) => `flex items-center px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
                  <Activity className="h-5 w-5 mr-3" /> Reports
                </NavLink>
              </li>
            )}
            <li>
              <NavLink to="/track" className={({isActive}) => `flex items-center px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-primary-50 text-primary-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
                <Search className="h-5 w-5 mr-3" /> Public Tracking
              </NavLink>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center max-w-full mb-4">
            <div className="bg-primary-100 text-primary-700 h-8 w-8 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-md hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-primary-600 mr-2" />
            <span className="font-bold text-lg">HCM Portal</span>
          </div>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-md">
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
