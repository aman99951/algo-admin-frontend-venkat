import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MetricsCards from '../features/dashboard/MetricsCards';
import PerformanceOverview from '../features/dashboard/PerformanceOverview';
import PositionsTable from '../features/trading/PositionsTable';
import UserHeader from '../components/UserHeader';
import { useAuthStore, useTradingStore } from '../store/store';
import './DashboardPage.css';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userInfo, sessionId } = useAuthStore();
  const { bots } = useTradingStore();

  useEffect(() => {
    document.title = 'Dashboard - TradeVault';
  }, []);

  // If we have a session but userInfo hasn't loaded yet, treat as "loading" (avoid flash)
  const profileLoading = !!sessionId && !userInfo;
  const connected = userInfo?.connected === true;
  const initialized = bots.length > 0;
  const running = bots.some((b) => b.running);

  return (
    <div className="page-container dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview & quick actions</p>
        </div>
        <UserHeader />
      </div>

      {!profileLoading && (!connected || !initialized) && (
        <div className="flow-banner">
          {!connected ? (
            <>
              <div className="flow-text">
                Step 1: Connect your broker in Settings to load real data.
              </div>
              <button className="flow-action" onClick={() => navigate('/settings')}>Go to Settings</button>
            </>
          ) : (
            <>
              <div className="flow-text">
                Step 2: Initialize bots in Trading (select indices + paper/live) before starting.
              </div>
              <button className="flow-action" onClick={() => navigate('/trading')}>Go to Trading</button>
            </>
          )}
        </div>
      )}

      {connected && initialized && (
        <div className="flow-banner">
          <div className="flow-text">
            {running ? 'Bot is running.' : 'Ready to start. Use Start Bot to begin trading.'}
          </div>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Metrics Cards - Compact, Most Important */}
        <div className="section metrics-section">
          <MetricsCards />
        </div>

        {/* Open Positions - Real-time position tracking */}
        <div className="section positions-section">
          <PositionsTable />
        </div>

        {/* Performance Chart - Main Dashboard Content */}
        <div className="section performance-section">
          <PerformanceOverview />
        </div>
      </div>
    </div>
  );
}
