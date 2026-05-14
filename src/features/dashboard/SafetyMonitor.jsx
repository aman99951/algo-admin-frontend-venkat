import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTradingStore } from '../../store/store';
import { tradingAPI } from '../../services/api';
import './SafetyMonitor.css';

export default function SafetyMonitor() {
  const { bots } = useTradingStore();
  const [safetyStats, setSafetyStats] = useState(null);

  useEffect(() => {
    loadSafetyStats();
    const interval = setInterval(loadSafetyStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSafetyStats = async () => {
    try {
      const response = await tradingAPI.getStatus();
      if (response.bots && response.bots.length > 0) {
        const bot = response.bots[0];
        setSafetyStats({
          stopLoss: bot.stop_loss_enabled || true,
          maxDrawdown: bot.max_loss || 5000,
          currentDrawdown: Math.abs(bot.current_pnl || 0),
          status: bot.running ? 'active' : 'inactive'
        });
      }
    } catch (err) {
      console.error('Failed to load safety stats:', err);
    }
  };

  const safetyStatus = safetyStats || {
    stopLoss: true,
    maxDrawdown: 5000,
    currentDrawdown: 0,
    status: 'inactive'
  };

  const drawdownPercentage = (Math.abs(safetyStatus.currentDrawdown) / safetyStatus.maxDrawdown) * 100;

  return (
    <div className="safety-monitor">
      <div className="section-header">
        <Shield size={20} />
        <h3>Safety Monitor</h3>
      </div>

      <div className="safety-stats">
        <div className="safety-stat">
          <div className="stat-icon success">
            <CheckCircle size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Stop Loss</span>
            <span className="stat-value success">Active</span>
          </div>
        </div>

        <div className="safety-stat">
          <div className={`stat-icon ${drawdownPercentage > 80 ? 'danger' : 'warning'}`}>
            <AlertTriangle size={18} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Max Drawdown</span>
            <span className={`stat-value ${drawdownPercentage > 80 ? 'danger' : 'warning'}`}>
              ₹{safetyStatus.currentDrawdown} / ₹{safetyStatus.maxDrawdown}
            </span>
          </div>
        </div>
      </div>

      <div className="drawdown-progress">
        <div className="progress-bar">
          <div 
            className={`progress-fill ${drawdownPercentage > 80 ? 'danger' : 'warning'}`}
            style={{ width: `${Math.min(drawdownPercentage, 100)}%` }}
          />
        </div>
        <span className="progress-label">{drawdownPercentage.toFixed(1)}% used</span>
      </div>
    </div>
  );
}
