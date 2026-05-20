import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/store';
import { useEffect, lazy, Suspense } from 'react';

// Auth (not lazy loaded - needed immediately)
import Login from './components/Login';

// Layout (not lazy loaded - core app structure)
import MainLayout from './layouts/MainLayout';

// Lazy loaded pages for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const TradingPage = lazy(() => import('./pages/TradingPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CreditsPage = lazy(() => import('./pages/CreditsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// Loading fallback component
function RouteLoader() {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#131722'
    }}>
      <div style={{
        textAlign: 'center',
        color: '#b0b3b8'
      }}>
        <div className="spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { sessionId } = useAuthStore();
  
  // Only check sessionId - isAuthenticated is derived from it
  if (!sessionId) {
    console.log('[ProtectedRoute] No session, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('[ProtectedRoute] Session exists, rendering dashboard');
  return children;
}

function App() {
  useEffect(() => {
    console.log('[App] Mounted successfully');
    console.log('[App] Current location:', window.location.pathname);
    
    // Display a visible indicator that React is working
    document.title = 'TradeVault - App Loaded ✓';
  }, []);

  try {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes with MainLayout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/trading" replace />} />
            <Route path="dashboard" element={
              <Suspense fallback={<RouteLoader />}>
                <DashboardPage />
              </Suspense>
            } />
            <Route path="trading" element={
              <Suspense fallback={<RouteLoader />}>
                <TradingPage />
              </Suspense>
            } />
            <Route path="analytics" element={
              <Suspense fallback={<RouteLoader />}>
                <AnalyticsPage />
              </Suspense>
            } />
            <Route path="history" element={
              <Suspense fallback={<RouteLoader />}>
                <HistoryPage />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<RouteLoader />}>
                <SettingsPage />
              </Suspense>
            } />
            <Route path="credits" element={
              <Suspense fallback={<RouteLoader />}>
                <CreditsPage />
              </Suspense>
            } />
            <Route path="admin" element={
              <Suspense fallback={<RouteLoader />}>
                <AdminPage />
              </Suspense>
            } />
            <Route path="credentials" element={
              <Suspense fallback={<RouteLoader />}>
                <SettingsPage />
              </Suspense>
            } />
          </Route>
        </Routes>
      </Router>
    );
  } catch (error) {
    console.error('[App] Error rendering:', error);
    return (
      <div style={{ padding: '20px', color: 'white', background: '#0a0e1a', minHeight: '100vh' }}>
        <h1>Application Error</h1>
        <pre style={{ color: 'red' }}>{error.toString()}</pre>
      </div>
    );
  }
}

export default App;
