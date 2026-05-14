import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Wallet } from 'lucide-react';
import { useTradingStore } from '../../store/store';
import { analyticsAPI } from '../../services/api';
import './MetricsCards.css';

export default function MetricsCards() {
  const { liveMetrics, setLiveMetrics } = useTradingStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000); // Refresh every 10 seconds (optimized)
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      const response = await analyticsAPI.getLiveMetrics();
      setLiveMetrics(response.metrics || {});
      setLoading(false);
    } catch (err) {
      console.error('Failed to load metrics:', err);
      setLoading(false);
    }
  };

  const hasMetrics = !!liveMetrics;
  const metrics = {
    todayPnl: liveMetrics?.today_pnl,
    availableBalance: liveMetrics?.available_balance,
    todayTrades: liveMetrics?.today_trades,
    winRate: liveMetrics?.win_rate,
  };

  return (
    <div className="metrics-cards">
      <div className={`metric-card primary ${metrics.todayPnl >= 0 ? 'positive-card' : 'negative-card'}`}>
        <div className="metric-icon">
          {metrics.todayPnl >= 0 ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
        </div>
        <div className="metric-content">
          <div className="metric-label">Today's P&L</div>
          <div className={`metric-value ${metrics.todayPnl >= 0 ? 'positive' : 'negative'}`}>
            {hasMetrics ? `₹${Number(metrics.todayPnl || 0).toFixed(2)}` : '—'}
          </div>
          <div className="metric-change">{metrics.todayPnl >= 0 ? 'Profit' : 'Loss'} today</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon info"><Wallet size={24} /></div>
        <div className="metric-content">
          <div className="metric-label">Available Balance</div>
          <div className="metric-value">{hasMetrics ? `₹${Number(metrics.availableBalance || 0).toFixed(2)}` : '—'}</div>
          <div className="metric-change">Broker margins</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon info">
          <Activity size={24} />
        </div>
        <div className="metric-content">
          <div className="metric-label">Today's Trades</div>
          <div className="metric-value">{hasMetrics ? (metrics.todayTrades ?? 0) : '—'}</div>
          <div className="metric-change">Closed trades</div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-icon success"><Activity size={24} /></div>
        <div className="metric-content">
          <div className="metric-label">Win Rate</div>
          <div className="metric-value">
            {hasMetrics && (metrics.todayTrades ?? 0) > 0 ? `${Number(metrics.winRate || 0).toFixed(1)}%` : '—'}
          </div>
          <div className="metric-change">Success rate</div>
        </div>
      </div>
    </div>
  );
}
