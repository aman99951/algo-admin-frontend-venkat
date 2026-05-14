import { useState, useEffect } from 'react';
import { Layers, X } from 'lucide-react';
import apiClient, { tradingAPI } from '../services/api';
import { useAuthStore } from '../store/store';
import './PositionsTable.css';

function PositionsTable() {
  const [allPositions, setAllPositions] = useState([]);  // All broker positions
  const [botPositions, setBotPositions] = useState([]);  // Bot-tracked positions
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exitingSymbol, setExitingSymbol] = useState(null);
  const { sessionId, sessionSecret } = useAuthStore();

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      setError('Not authenticated. Please login again.');
      return;
    }

    loadPositions();

    // Poll every 10 seconds for position updates (avoids excessive API load)
    const interval = setInterval(loadPositions, 10000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const loadPositions = async () => {
    try {
      setError('');
      // Fetch bot-tracked positions (from trading endpoint)
      const botPosResponse = await tradingAPI.getPositions();
      setBotPositions(botPosResponse.positions || []);
      setAllPositions(botPosResponse.positions || []); // Use same data for now
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading positions:', error);
      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;
      if (status === 401) {
        setError('Session expired or broker adapter disconnected. Please login again.');
      } else if (status === 403) {
        setError('Not authorized (missing session secret). Please login again.');
      } else {
        setError(detail || error?.message || 'Failed to load positions');
      }
      setLoading(false);
    }
  };

  const handleExitPosition = async (symbol) => {
    if (!confirm(`Are you sure you want to EXIT ${symbol}? This will place a market order to square off.`)) {
      return;
    }

    setExitingSymbol(symbol);
    try {
      const response = await apiClient.post(`/positions/exit/${encodeURIComponent(symbol)}`);
      const data = response.data;
      alert(`✅ Exit order placed successfully!\nOrder ID: ${data.order_id}`);
      loadPositions();  // Refresh positions
    } catch (error) {
      console.error('Error exiting position:', error);
      const detail = error?.response?.data?.detail || error.message || 'Unknown error';
      alert(`❌ Failed to exit position: ${detail}`);
    } finally {
      setExitingSymbol(null);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="table-loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card positions-table">
      <div className="table-header">
        <div className="table-title">
          <Layers size={20} />
          <h2>Open Positions</h2>
        </div>
        <span className="table-count">
          {allPositions.length} position(s) | 
          {allPositions.filter(p => p.is_bot_managed).length} 🤖 Bot | 
          {allPositions.filter(p => !p.is_bot_managed).length} 👤 Manual
        </span>
      </div>

      {error && (
        <div className="table-empty">
          <p>⚠️ {error}</p>
          <p className="table-empty-hint">If you recently redeployed, try a hard refresh (Cmd+Shift+R). If the backend restarted, re-login to reconnect the broker adapter.</p>
        </div>
      )}
      
      {!error && allPositions.length === 0 ? (
        <div className="table-empty">
          <p>No open positions</p>
          <p className="table-empty-hint">Positions will appear here after login if you have open trades</p>
        </div>
      ) : (
        !error &&
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Classification</th>
                <th>Index</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Strike</th>
                <th>Qty</th>
                <th>Entry Price</th>
                <th>Current LTP</th>
                <th>P&L</th>
                <th>Protection</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allPositions.map((pos, index) => {
                const pnl = pos.pnl || 0;
                const isExiting = exitingSymbol === pos.tradingsymbol;
                const optionType = (pos.option_type || 'NA');
                
                return (
                  <tr key={index}>
                    <td>
                      <span className={`classification-badge ${pos.is_bot_managed ? 'bot' : 'manual'}`}>
                        {pos.classification}
                      </span>
                    </td>
                    <td className="cell-bold">{pos.index_name}</td>
                    <td className="cell-secondary">{pos.tradingsymbol}</td>
                    <td>
                      <span className={`option-badge ${optionType.toLowerCase()}`}>
                        {optionType}
                      </span>
                    </td>
                    <td>{pos.strike}</td>
                    <td>{pos.quantity_abs}</td>
                    <td>₹{Number(pos.average_price).toFixed(2)}</td>
                    <td>₹{Number(pos.last_price || pos.average_price).toFixed(2)}</td>
                    <td className={pnl >= 0 ? 'cell-positive' : 'cell-negative'}>
                      ₹{Number(pnl).toFixed(2)}
                    </td>
                    <td>
                      {pos.gtt_id ? (
                        <span className="gtt-badge gtt-active" title={`GTT OCO ID: ${pos.gtt_id}`}>
                          🛡️ GTT OCO
                        </span>
                      ) : (
                        <span className="gtt-badge gtt-none" title="No GTT protection">
                          ⚠️ None
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="exit-button"
                        onClick={() => handleExitPosition(pos.tradingsymbol)}
                        disabled={isExiting}
                        title="Square off this position"
                      >
                        {isExiting ? (
                          <>⏳ Exiting...</>
                        ) : (
                          <>
                            <X size={14} />
                            Exit
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {allPositions.length > 0 && (
        <div className="table-footer">
          <div className="table-legend">
            <span className="legend-item">
              <span className="classification-badge bot">Bot Managed</span>
              = Position with GTT OCO (bot will manage)
            </span>
            <span className="legend-item">
              <span className="classification-badge manual">Manual</span>
              = No GTT protection (user manually controls)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default PositionsTable;
