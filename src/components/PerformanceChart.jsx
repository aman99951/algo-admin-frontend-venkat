import { useState, useEffect, useCallback, useRef } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { analyticsAPI } from '../services/api';
import './PerformanceChart.css';

function PerformanceChart({ refreshTrigger }) {
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const hasDataRef = useRef(false);

  const loadChartData = useCallback(async () => {
    // Don't show spinner if we already have data (background refresh)
    if (!hasDataRef.current) setLoading(true);
    setError(null);
    
    try {
      console.log('[PerformanceChart] Fetching chart data for period:', period);
      const response = await analyticsAPI.getPnLChart(null, period);
      
      console.log('[PerformanceChart] Received data:', {
        success: response.success,
        count: response.count,
        dataLength: response.data?.length
      });
      
      const data = response.data || [];
      setChartData(data);
      hasDataRef.current = data.length > 0;
      
      if (data.length === 0) {
        console.log('[PerformanceChart] No chart data available - user may not have closed trades yet');
      }
    } catch (error) {
      console.error('[PerformanceChart] Error loading chart data:', error);
      setError('Failed to load chart data');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData, refreshTrigger]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatValue = (value) => {
    return `₹${value.toFixed(2)}`;
  };

  return (
    <div className="card performance-chart">
      <div className="chart-header">
        <div className="chart-title">
          <TrendingUp size={20} />
          <h2>Performance</h2>
        </div>
        
        <div className="period-selector">
          {['today', 'week', 'month'].map((p) => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {loading ? (
        <div className="chart-loading">
          <div className="spinner"></div>
          <p style={{ marginTop: '10px', color: '#8a8d91' }}>Loading performance data...</p>
        </div>
      ) : error ? (
        <div className="chart-empty">
          <TrendingUp size={48} style={{ color: '#f44336', marginBottom: '10px' }} />
          <p style={{ color: '#f44336', marginBottom: '10px' }}>{error}</p>
          <button 
            onClick={loadChartData}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Retry
          </button>
        </div>
      ) : chartData.length === 0 ? (
        <div className="chart-empty">
          <TrendingUp size={48} style={{ color: '#8a8d91', marginBottom: '10px' }} />
          <p>No trading data yet to display performance</p>
          <p style={{ fontSize: '14px', color: '#8a8d91', marginTop: '8px' }}>
            Chart will appear once there is activity (open or closed positions)
          </p>
        </div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2196f3" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#2196f3" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3548" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={formatTime}
                stroke="#8a8d91"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                tickFormatter={formatValue}
                stroke="#8a8d91"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e2330',
                  border: '1px solid #2d3548',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                labelStyle={{ color: '#b0b3b8' }}
                formatter={(value) => [formatValue(value), 'Cumulative P&L']}
                labelFormatter={formatTime}
              />
              <Area
                type="monotone"
                dataKey="cumulative_pnl"
                stroke="#2196f3"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPnl)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default PerformanceChart;
