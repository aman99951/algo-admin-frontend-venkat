import { useState, useEffect } from 'react';
import PerformanceChart from '../features/analytics/PerformanceChart';
import TradesTable from '../features/analytics/TradesTable';
import UserHeader from '../components/UserHeader';
import { Activity, DollarSign, Target } from 'lucide-react';
import { useTradingStore } from '../store/store';
import { analyticsAPI } from '../services/api';
import { wsService } from '../services/websocket';
import './AnalyticsPage.css';

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('today');
  const [refreshKey, setRefreshKey] = useState(0);
  const { liveMetrics, setLiveMetrics } = useTradingStore();

  useEffect(() => {
    document.title = 'Analytics - TradeVault';
    loadMetrics();

    const handleMetricsUpdate = () => {
      loadMetrics();
      setRefreshKey((k) => k + 1);
    };

    wsService.on('metrics_update', handleMetricsUpdate);
    const interval = setInterval(() => {
      loadMetrics();
    }, 10000);

    return () => {
      wsService.off('metrics_update', handleMetricsUpdate);
      clearInterval(interval);
    };
  }, [timeframe]);

  const loadMetrics = async () => {
    try {
      const response = await analyticsAPI.getPerformance(null, timeframe);
      setLiveMetrics(response.metrics || null);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    }
  };

  const stats = {
    totalTrades: liveMetrics?.total_trades,
    totalPnl: liveMetrics?.total_pnl,
    winRate: liveMetrics?.win_rate,
    profitFactor: liveMetrics?.profit_factor,
  };

  return (
    <div className="page-container analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Performance Analytics</h1>
          <p className="page-subtitle">Track your trading performance and insights</p>
        </div>
        <UserHeader />

        {/* Timeframe Selector */}
        <div className="timeframe-selector">
          <button
            className={`timeframe-btn ${timeframe === 'today' ? 'active' : ''}`}
            onClick={() => setTimeframe('today')}
          >
            Today
          </button>
          <button
            className={`timeframe-btn ${timeframe === 'week' ? 'active' : ''}`}
            onClick={() => setTimeframe('week')}
          >
            Week
          </button>
          <button
            className={`timeframe-btn ${timeframe === 'month' ? 'active' : ''}`}
            onClick={() => setTimeframe('month')}
          >
            Month
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card pnl">
          <div className="stat-icon">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total P&L</div>
            <div className={`stat-value ${Number(stats.totalPnl || 0) >= 0 ? 'positive' : 'negative'}`}>₹{Number(stats.totalPnl || 0).toFixed(2)}</div>
            <div className="stat-change neutral">Period: {timeframe}</div>
          </div>
        </div>

        <div className="stat-card trades">
          <div className="stat-icon">
            <Activity size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Trades</div>
            <div className="stat-value">{stats.totalTrades ?? 0}</div>
            <div className="stat-change neutral">Period: {timeframe}</div>
          </div>
        </div>

        <div className="stat-card profit">
          <div className="stat-icon">
            <Target size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Win Rate</div>
            <div className="stat-value">{Number(stats.winRate || 0).toFixed(1)}%</div>
            <div className="stat-change neutral">From closed trades</div>
          </div>
        </div>

        <div className="stat-card pnl">
          <div className="stat-icon">
            <DollarSign size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Profit Factor</div>
            <div className="stat-value">{Number(stats.profitFactor || 0).toFixed(2)}</div>
            <div className="stat-change neutral">Gross profit / gross loss</div>
          </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="section chart-section">
        <h2 className="section-title">Performance Chart</h2>
        <PerformanceChart refreshTrigger={refreshKey} />
      </div>

      {/* Recent Trades */}
      <div className="section trades-section">
        <h2 className="section-title">Recent Trades</h2>
        <TradesTable limit={10} />
      </div>
    </div>
  );
}
