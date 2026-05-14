import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { tradingAPI } from '../services/api';
import './SafetyStats.css';

function SafetyStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setError('');
      const response = await tradingAPI.getSafetyStats();
      setStats(response.stats);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load safety stats:', err);
      setError('Failed to load safety stats');
      setLoading(false);
    }
  };

  if (loading) return null;
  if (error) return null;
  if (!stats) return null;

  const getStatusColor = () => {
    if (!stats.can_trade) return 'status-blocked';
    if (stats.daily_pnl < -(stats.max_loss_per_day * 0.5)) return 'status-warning';
    return 'status-ok';
  };

  const getRemainingOrders = () => {
    return Math.max(0, stats.max_orders_per_day - stats.orders_today);
  };

  const getLossBufferPercent = () => {
    return (stats.remaining_loss_buffer / stats.max_loss_per_day) * 100;
  };

  return (
    <div className={`safety-stats-banner ${getStatusColor()}`}>
      <div className="safety-stats-header">
        <Shield size={20} />
        <span className="safety-title">Trading Safety Monitor</span>
      </div>

      <div className="safety-stats-grid">
        {/* Trading Status */}
        <div className="safety-stat">
          {stats.can_trade ? (
            <CheckCircle size={16} className="icon-ok" />
          ) : (
            <XCircle size={16} className="icon-blocked" />
          )}
          <div className="stat-content">
            <div className="stat-label">Status</div>
            <div className="stat-value">
              {stats.can_trade ? 'Active' : 'Blocked'}
            </div>
          </div>
        </div>

        {/* Orders Today */}
        <div className="safety-stat">
          <div className="stat-content">
            <div className="stat-label">Orders Today</div>
            <div className="stat-value">
              {stats.orders_today} / {stats.max_orders_per_day}
              <small>({getRemainingOrders()} left)</small>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="safety-stat">
          <div className="stat-content">
            <div className="stat-label">Open Positions</div>
            <div className="stat-value">
              {stats.open_positions || 0} / {stats.max_positions || 4}
            </div>
          </div>
        </div>

        {/* Daily P&L */}
        <div className="safety-stat">
          <div className="stat-content">
            <div className="stat-label">Daily P&L</div>
            <div className={`stat-value ${stats.daily_pnl >= 0 ? 'positive' : 'negative'}`}>
              ₹{stats.daily_pnl?.toFixed(2) || '0.00'}
            </div>
          </div>
        </div>

        {/* Loss Buffer */}
        <div className="safety-stat">
          {stats.remaining_loss_buffer < (stats.max_loss_per_day * 0.2) && (
            <AlertTriangle size={16} className="icon-warning" />
          )}
          <div className="stat-content">
            <div className="stat-label">Loss Buffer</div>
            <div className="stat-value">
              ₹{stats.remaining_loss_buffer?.toFixed(2) || '0.00'}
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${getLossBufferPercent()}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {!stats.can_trade && (
        <div className="safety-alert">
          <AlertTriangle size={16} />
          <span>Trading blocked: Daily loss limit reached</span>
        </div>
      )}
    </div>
  );
}

export default SafetyStats;
