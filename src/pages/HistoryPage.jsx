import { useState, useEffect, useRef } from 'react';
import TradeHistory from '../features/analytics/TradeHistory';
import UserHeader from '../components/UserHeader';
import { Filter, Download, Calendar } from 'lucide-react';
import './HistoryPage.css';

export default function HistoryPage() {
  const [filter, setFilter] = useState('all');
  const tradeHistoryRef = useRef(null);

  useEffect(() => {
    document.title = 'Trade History - TradeVault';
  }, []);

  return (
    <div className="page-container history-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trade History</h1>
          <p className="page-subtitle">View and analyze your past trades</p>
        </div>
        <UserHeader />

        <div className="header-actions">
          <button
            className="action-btn secondary"
            onClick={() => tradeHistoryRef.current?.focusDateRange?.()}
            type="button"
          >
            <Calendar size={18} />
            <span>Date Range</span>
          </button>
          <button
            className="action-btn secondary"
            onClick={() => tradeHistoryRef.current?.focusFilters?.()}
            type="button"
          >
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <button
            className="action-btn primary"
            onClick={() => tradeHistoryRef.current?.exportCSV?.()}
            type="button"
          >
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Trades
        </button>
        <button
          className={`filter-tab ${filter === 'winners' ? 'active' : ''}`}
          onClick={() => setFilter('winners')}
        >
          Winners
        </button>
        <button
          className={`filter-tab ${filter === 'losers' ? 'active' : ''}`}
          onClick={() => setFilter('losers')}
        >
          Losers
        </button>
        <button
          className={`filter-tab ${filter === 'open' ? 'active' : ''}`}
          onClick={() => setFilter('open')}
        >
          Open
        </button>
      </div>

      {/* Trade History Table */}
      <div className="section">
        <TradeHistory ref={tradeHistoryRef} filter={filter} />
      </div>
    </div>
  );
}
