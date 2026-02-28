import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { ThemeProvider } from './hooks/useTheme';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { NewCasePage } from './pages/NewCasePage';
import { DashboardPage } from './pages/DashboardPage';
import { CaseListPage } from './pages/CaseListPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { ReportsPage } from './pages/ReportsPage';
import { TrackCasePage } from './pages/TrackCasePage';
import { BookAppointmentPage } from './pages/BookAppointmentPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="flex h-screen items-center justify-center text-surface-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/book" element={<BookAppointmentPage />} />
            <Route path="/track" element={<TrackCasePage />} />

            {/* Admin / Staff pages */}
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/cases" element={<ProtectedRoute><CaseListPage /></ProtectedRoute>} />
            <Route path="/cases/new" element={<ProtectedRoute><NewCasePage /></ProtectedRoute>} />
            <Route path="/cases/:id" element={<ProtectedRoute><CaseDetailPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

            {/* 404 Catch-all */}
            <Route path="*" element={
              <div className="flex h-screen items-center justify-center flex-col gap-4">
                <h1 className="text-4xl font-bold text-surface-200">404</h1>
                <p className="text-surface-400">Page not found</p>
                <a href="/" className="text-primary-400 hover:underline">Go to Dashboard</a>
              </div>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
