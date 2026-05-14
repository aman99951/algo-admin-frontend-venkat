import React from 'react';
import { TrendingUp, TrendingDown, Activity, Zap, BarChart2 } from 'lucide-react';
import './LiveMarketPanel.css';

function LiveMarketPanel({ metrics, indexName }) {
  if (!metrics) return <div className="live-panel-empty">Waiting for data...</div>;

  const {
    price,
    force_index,
    acceleration,
    momentum,
    volatility,
    rsi,
    decision,
    reason
  } = metrics;

  // Helper to determine color based on value
  const getValueColor = (val, type) => {
    if (type === 'rsi') {
      if (val > 70) return 'text-red';
      if (val < 30) return 'text-green';
      return 'text-neutral';
    }
    if (val > 0) return 'text-green';
    if (val < 0) return 'text-red';
    return 'text-neutral';
  };

  const getDecisionColor = (dec) => {
    if (!dec) return 'decision-wait';
    const decStr = String(dec);
    if (decStr.includes('BUY')) return 'decision-buy';
    if (decStr.includes('SELL')) return 'decision-sell';
    return 'decision-wait';
  };

  return (
    <div className="live-market-panel">
      <div className="panel-header">
        <h3>{indexName}</h3>
        <div className="live-price">₹{price?.toFixed(2)}</div>
      </div>

      <div className="indicators-grid">
        <div className="indicator-item">
          <span className="label">Force Index</span>
          <span className={`value ${getValueColor(force_index)}`}>
            {force_index?.toFixed(4)}
          </span>
        </div>
        
        <div className="indicator-item">
          <span className="label">Momentum</span>
          <span className={`value ${getValueColor(momentum)}`}>
            {momentum?.toFixed(4)}
          </span>
        </div>

        <div className="indicator-item">
          <span className="label">Acceleration</span>
          <span className={`value ${getValueColor(acceleration)}`}>
            {acceleration?.toFixed(4)}
          </span>
        </div>

        <div className="indicator-item">
          <span className="label">Volatility</span>
          <span className="value text-neutral">
            {volatility?.toFixed(4)}
          </span>
        </div>
        
        <div className="indicator-item">
          <span className="label">RSI</span>
          <span className={`value ${getValueColor(rsi, 'rsi')}`}>
            {rsi?.toFixed(1)}
          </span>
        </div>
      </div>

      <div className={`decision-box ${getDecisionColor(decision)}`}>
        <div className="decision-main">{decision}</div>
        <div className="decision-reason">{reason}</div>
      </div>
    </div>
  );
}

export default LiveMarketPanel;
