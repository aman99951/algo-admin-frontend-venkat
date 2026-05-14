import { TrendingUp, DollarSign, Activity, Target } from 'lucide-react';
import './MetricsCards.css';

function MetricsCards({ metrics }) {
  console.log('[MetricsCards DEBUG] metrics:', metrics);
  if (!metrics) {
    return null;
  }

  const cards = [
    {
      title: 'Today\'s P&L',
      value: `₹${metrics.today_pnl?.toFixed(2) || '0.00'}`,
      icon: <DollarSign size={24} />,
      color: metrics.today_pnl >= 0 ? 'success' : 'error',
      change: metrics.today_pnl >= 0 ? 'up' : 'down',
    },
    {
      title: 'Active Bots',
      value: `${metrics.bots_running || 0}/${metrics.total_bots || 0}`,
      icon: <Activity size={24} />,
      color: 'info',
    },
    {
      title: 'Open Positions',
      value: metrics.active_positions || 0,
      icon: <Target size={24} />,
      color: 'warning',
    },
    {
      title: 'Trades Today',
      value: metrics.today_trades || 0,
      icon: <TrendingUp size={24} />,
      color: 'purple',
    },
  ];

  return (
    <div className="metrics-cards">
      {cards.map((card, index) => (
        <div key={index} className={`metric-card metric-card-${card.color}`}>
          <div className="metric-icon">
            {card.icon}
          </div>
          <div className="metric-content">
            <div className="metric-title">{card.title}</div>
            <div className="metric-value">{card.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MetricsCards;
