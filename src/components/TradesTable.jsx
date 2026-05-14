import { useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import { tradingAPI } from '../services/api';
import { useTradingStore } from '../store/store';
import './TradesTable.css';

function TradesTable() {
  const { trades, setTrades } = useTradingStore();
  const [filter, setFilter] = useState('all'); // all, winners, losers
  const [refreshing, setRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await tradingAPI.getTrades();
      setTrades(response.trades || []);
      console.log(`[TradesTable] Refreshed ${response.trades?.length || 0} trades`);
    } catch (error) {
      console.error('Error refreshing trades:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredTrades = trades.filter((trade) => {
    if (filter === 'winners') return trade.pnl > 0;
    if (filter === 'losers') return trade.pnl < 0;
    return true;
  });

  return (
    <div className="card trades-table">
      <div className="table-header">
        <div className="table-title">
          <History size={20} />
          <h2>Trade History</h2>
          <button 
            className="refresh-btn" 
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Refresh trades"
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>
        
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-btn ${filter === 'winners' ? 'active' : ''}`}
            onClick={() => setFilter('winners')}
          >
            Winners
          </button>
          <button
            className={`filter-btn ${filter === 'losers' ? 'active' : ''}`}
            onClick={() => setFilter('losers')}
          >
            Losers
          </button>
        </div>
      </div>
      
      {filteredTrades.length === 0 ? (
        <div className="table-empty">
          <p>No trades yet</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Symbol</th>
                <th>Type</th>
                <th>Signal</th>
                <th>Entry</th>
                <th>Exit</th>
                <th>Return %</th>
                <th>P&L</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade, index) => {
                const returnPct = trade.pnl_percentage || (trade.entry_price && trade.exit_price ? ((trade.exit_price - trade.entry_price) / trade.entry_price * 100) : 0);
                return (
                <tr key={trade.id || index}>
                  <td className="cell-secondary">
                    {trade.entry_time ? new Date(trade.entry_time).toLocaleString() : 'N/A'}
                  </td>
                  <td className="cell-bold" style={{ fontSize: '12px' }}>
                    {trade.symbol || trade.index_name || 'N/A'}
                  </td>
                  <td>
                    <span className={`signal-badge ${trade.paper_mode ? 'paper' : 'live'}`}>
                      {trade.paper_mode ? '📄 Paper' : '💰 Live'}
                    </span>
                  </td>
                  <td>
                    <span className={`signal-badge ${(trade.option_type || '').toLowerCase()}`}>
                      {trade.option_type || 'N/A'}
                    </span>
                  </td>
                  <td>₹{trade.entry_price?.toFixed(2) || 'N/A'}</td>
                  <td>₹{trade.exit_price?.toFixed(2) || 'N/A'}</td>
                  <td className={returnPct >= 0 ? 'cell-positive' : 'cell-negative'}>
                    {returnPct ? `${returnPct.toFixed(2)}%` : 'N/A'}
                  </td>
                  <td className={trade.pnl >= 0 ? 'cell-positive' : 'cell-negative'}>
                    ₹{trade.pnl?.toFixed(2) || '0.00'}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default TradesTable;
