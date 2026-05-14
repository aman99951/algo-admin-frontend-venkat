import './ThresholdIndicators.css';
import { safeFixed, safeLower, safeNumber } from '../utils/helpers';

function ThresholdIndicators({ metrics, config }) {
  if (!metrics) return null;

  // Default thresholds (should match bot config)
  const thresholds = {
    force_index: {
      min: config?.force_index_min || 0.15,
      max: config?.force_index_max || 4.50,
      optimal_min: 0.25,
      optimal_max: 3.50
    },
    momentum: {
      min: config?.momentum_min || 0.002,
      optimal_min: 0.005
    },
    acceleration: {
      min: config?.acceleration_breakout_min || -0.001,
      dip_min: -0.002,
      dip_max: config?.acceleration_dip_max || -0.001
    },
    volatility: {
      min: config?.volatility_min || 0.015,
      optimal_min: 0.020
    },
    rsi: {
      min: 30,
      max: 70,
      optimal_min: 40,
      optimal_max: 60
    }
  };

  const checks = [
    {
      name: 'Force Index',
      value: safeNumber(metrics.force_index, 0),
      min: thresholds.force_index.min,
      max: thresholds.force_index.max,
      optimal_min: thresholds.force_index.optimal_min,
      optimal_max: thresholds.force_index.optimal_max,
      unit: '',
      scale: 5.0 // Max scale for visualization
    },
    {
      name: 'Momentum',
      value: safeNumber(metrics.momentum, 0),
      min: thresholds.momentum.min,
      optimal_min: thresholds.momentum.optimal_min,
      unit: '',
      scale: 0.02 // Max scale for visualization
    },
    {
      name: 'Acceleration',
      value: safeNumber(metrics.acceleration, 0),
      min: thresholds.acceleration.min,
      dip_min: thresholds.acceleration.dip_min,
      dip_max: thresholds.acceleration.dip_max,
      unit: '',
      scale: 0.01, // Max scale
      centerZero: true // Show as bipolar (-/+)
    },
    {
      name: 'Volatility',
      value: safeNumber(metrics.volatility, 0),
      min: thresholds.volatility.min,
      optimal_min: thresholds.volatility.optimal_min,
      unit: '%',
      scale: 0.05 // Max scale
    },
    {
      name: 'RSI',
      value: safeNumber(metrics.rsi, 50),
      min: thresholds.rsi.min,
      max: thresholds.rsi.max,
      optimal_min: thresholds.rsi.optimal_min,
      optimal_max: thresholds.rsi.optimal_max,
      unit: '',
      scale: 100,
      fixedScale: true // RSI is always 0-100
    }
  ];

  const getStatus = (check) => {
    const { value, min, max, optimal_min, optimal_max, dip_min, dip_max, fixedScale } = check;

    // RSI special case
    if (check.name === 'RSI') {
      if (value < min || value > max) return 'danger';
      if (value >= optimal_min && value <= optimal_max) return 'optimal';
      return 'warning';
    }

    // Acceleration special case (dip buying)
    if (check.name === 'Acceleration') {
      if (value >= min) return 'success'; // Breakout
      if (value >= dip_min && value <= dip_max) return 'optimal'; // Dip buy zone
      return 'danger'; // Too negative
    }

    // Standard checks
    if (min !== undefined && value < min) return 'danger';
    if (max !== undefined && value > max) return 'warning';
    if (optimal_min !== undefined && optimal_max !== undefined) {
      if (value >= optimal_min && value <= optimal_max) return 'optimal';
    } else if (optimal_min !== undefined && value >= optimal_min) {
      return 'optimal';
    }
    if (value >= min) return 'success';
    return 'danger';
  };

  const getBarWidth = (check) => {
    const { value, scale, centerZero, fixedScale } = check;
    
    if (fixedScale) {
      // Fixed scale like RSI (0-100)
      return Math.max(0, Math.min(100, (value / scale) * 100));
    }
    
    if (centerZero) {
      // Bipolar scale (acceleration)
      const halfScale = scale / 2;
      const normalized = (value + halfScale) / scale; // Shift to 0-1 range
      return Math.max(0, Math.min(100, normalized * 100));
    }
    
    // Standard scale (0 to max)
    return Math.max(0, Math.min(100, (Math.abs(value) / scale) * 100));
  };

  const getMinMarker = (check) => {
    const { min, scale, centerZero, fixedScale } = check;
    if (!min) return 0;
    
    if (fixedScale) {
      return (min / scale) * 100;
    }
    
    if (centerZero) {
      const halfScale = scale / 2;
      return ((min + halfScale) / scale) * 100;
    }
    
    return (min / scale) * 100;
  };

  const getOptimalZone = (check) => {
    const { optimal_min, optimal_max, dip_min, dip_max, scale, centerZero, fixedScale } = check;
    
    // Dip zone for acceleration
    if (check.name === 'Acceleration' && dip_min !== undefined) {
      const halfScale = scale / 2;
      const start = ((dip_min + halfScale) / scale) * 100;
      const end = ((dip_max + halfScale) / scale) * 100;
      return { start, width: end - start };
    }
    
    if (!optimal_min) return null;
    
    if (fixedScale && optimal_max) {
      return { 
        start: (optimal_min / scale) * 100,
        width: ((optimal_max - optimal_min) / scale) * 100
      };
    }
    
    if (centerZero) {
      const halfScale = scale / 2;
      const start = ((optimal_min + halfScale) / scale) * 100;
      const end = optimal_max ? ((optimal_max + halfScale) / scale) * 100 : 100;
      return { start, width: end - start };
    }
    
    return { 
      start: (optimal_min / scale) * 100,
      width: optimal_max ? ((optimal_max - optimal_min) / scale) * 100 : 30
    };
  };

  return (
    <div className="threshold-indicators">
      <div className="threshold-header">
        <h4>Entry Conditions Monitor</h4>
        <div className="legend">
          <span className="legend-item"><span className="dot danger"></span>Below Min</span>
          <span className="legend-item"><span className="dot success"></span>Above Min</span>
          <span className="legend-item"><span className="dot optimal"></span>Optimal</span>
        </div>
      </div>
      
      <div className="threshold-list">
        {checks.map((check) => {
          const status = getStatus(check);
          const barWidth = getBarWidth(check);
          const minMarker = getMinMarker(check);
          const optimalZone = getOptimalZone(check);
          
          return (
            <div key={check.name} className="threshold-item">
              <div className="threshold-label">
                <span className="threshold-name">{check.name}</span>
                <span className={`threshold-value ${status}`}>
                  {safeFixed(check.value, check.name === 'RSI' ? 1 : 4, '—')}{check.unit}
                </span>
              </div>
              
              <div className="threshold-bar-container">
                {/* Optimal zone background */}
                {optimalZone && (
                  <div 
                    className="optimal-zone" 
                    style={{ 
                      left: `${optimalZone.start}%`,
                      width: `${optimalZone.width}%`
                    }}
                  />
                )}
                
                {/* Minimum threshold marker */}
                {check.min !== undefined && (
                  <div 
                    className="min-marker" 
                    style={{ left: `${minMarker}%` }}
                    title={`Min: ${check.min}`}
                  />
                )}
                
                {/* Center line for bipolar scales */}
                {check.centerZero && (
                  <div className="center-marker" style={{ left: '50%' }} />
                )}
                
                {/* Actual value bar */}
                <div 
                  className={`threshold-bar ${status}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              
              <div className="threshold-info">
                {check.min !== undefined && (
                  <span className="info-text">Min: {check.min}</span>
                )}
                {check.optimal_min !== undefined && (
                  <span className="info-text optimal">
                    Optimal: {check.optimal_min}
                    {check.optimal_max ? ` - ${check.optimal_max}` : '+'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {metrics.regime && (
        <div className="regime-indicator">
          <span className="regime-label">Market Regime:</span>
          <span className={`regime-value ${safeLower(metrics.regime, '')}`}>
            {String(metrics.regime)}
          </span>
        </div>
      )}
    </div>
  );
}

export default ThresholdIndicators;
