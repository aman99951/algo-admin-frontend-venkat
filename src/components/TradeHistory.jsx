import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { analyticsAPI } from '../services/api';
import { Calendar, Filter, Download, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { safeLower } from '../utils/helpers';
import './TradeHistory.css';

/**
 * Safely format a date string. Returns fallback if the date is invalid
 * to prevent date-fns format() from throwing RangeError.
 */
function safeFormat(dateStr, pattern, fallback = '—') {
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    return isValid(d) ? format(d, pattern) : fallback;
  } catch {
    return fallback;
  }
}

const COMPLETED_STATUSES = new Set(['CLOSED', 'EXITED']);

function normalizeStatus(status) {
  if (!status) return '';
  return String(status).toUpperCase();
}

function normalizeOptionType(optionType) {
  if (!optionType) return '';
  const val = String(optionType).toUpperCase();
  return val === 'PE' || val === 'CE' ? val : val;
}

const TradeHistory = forwardRef(function TradeHistory({ filter = 'all' }, ref) {
  const [trades, setTrades] = useState([]);
  const [filteredTrades, setFilteredTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [filterIndex, setFilterIndex] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSignal, setFilterSignal] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtersSectionRef = useRef(null);
  const dateFromInputRef = useRef(null);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    profitable: 0,
    losing: 0,
    totalPnL: 0,
    winRate: 0
  });

  useEffect(() => {
    loadTrades();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trades, filter, filterIndex, filterStatus, filterSignal, dateFrom, dateTo]);

  useImperativeHandle(ref, () => ({
    focusDateRange: () => {
      filtersSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
      setTimeout(() => dateFromInputRef.current?.focus?.(), 0);
    },
    focusFilters: () => {
      filtersSectionRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
    },
    exportCSV: () => {
      exportToCSV();
    },
  }));

  const loadTrades = async () => {
    try {
      setLoading(true);
      setError('');
      // Use persistent DB-backed endpoint to ensure filters/date ranges are reliable.
      const response = await analyticsAPI.getTrades(null, 2000);
      const rawTrades = response.trades || [];
      const normalized = rawTrades.map((t) => ({
        ...t,
        status: normalizeStatus(t.status),
        option_type: normalizeOptionType(t.option_type),
        index_name: t.index_name ? String(t.index_name).toUpperCase() : t.index_name,
      }));
      setTrades(normalized);
    } catch (err) {
      console.error('Failed to load trades:', err);
      setError(err.response?.data?.detail || 'Failed to load trade history');
    } finally {
      setLoading(false);
    }
  };

  const presetFilterFn = useMemo(() => {
    const f = String(filter || 'all').toLowerCase();
    if (f === 'winners') {
      return (t) => (t?.pnl ?? 0) > 0;
    }
    if (f === 'losers') {
      return (t) => (t?.pnl ?? 0) < 0;
    }
    if (f === 'open') {
      return (t) => {
        const st = normalizeStatus(t?.status);
        return st === 'OPEN' || st === 'PENDING';
      };
    }
    return () => true;
  }, [filter]);

  const applyFilters = () => {
    let filtered = [...trades];

    // Apply History page preset filter first
    filtered = filtered.filter(presetFilterFn);
    
    // Filter by index
    if (filterIndex !== 'ALL') {
      filtered = filtered.filter(t => t.index_name === filterIndex);
    }
    
    // Filter by status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }
    
    // Filter by signal (CE/PE)
    if (filterSignal !== 'ALL') {
      filtered = filtered.filter(t => normalizeOptionType(t.option_type) === filterSignal);
    }
    
    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(t => t.entry_time && new Date(t.entry_time) >= new Date(dateFrom));
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(t => t.entry_time && new Date(t.entry_time) <= endDate);
    }
    
    setFilteredTrades(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (tradeList) => {
    const completed = tradeList.filter(t => COMPLETED_STATUSES.has(normalizeStatus(t.status)));
    const profitable = completed.filter(t => t.pnl > 0);
    const losing = completed.filter(t => t.pnl < 0);
    const totalPnL = completed.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winRate = completed.length > 0 ? (profitable.length / completed.length) * 100 : 0;
    
    setStats({
      total: tradeList.length,
      profitable: profitable.length,
      losing: losing.length,
      totalPnL,
      winRate
    });
  };

  const resetFilters = () => {
    setFilterIndex('ALL');
    setFilterStatus('ALL');
    setFilterSignal('ALL');
    setDateFrom('');
    setDateTo('');
  };

  const exportToCSV = () => {
    if (filteredTrades.length === 0) return;
    
    const headers = ['Entry Time', 'Index', 'Symbol', 'Side', 'Quantity', 'Entry Price', 'Exit Price', 'P&L', 'Status'];
    const rows = filteredTrades.map(t => [
      safeFormat(t.entry_time, 'yyyy-MM-dd HH:mm:ss', ''),
      t.index_name,
      t.symbol,
      t.side,
      t.quantity,
      t.entry_price,
      t.exit_price || 'N/A',
      t.pnl || 0,
      t.status
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trades_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status) => {
    const colors = {
      OPEN: 'status-open',
      PENDING: 'status-pending',
      CLOSED: 'status-closed',
      EXITED: 'status-exited',
      REJECTED: 'status-rejected'
    };
    return colors[status] || 'status-default';
  };

  const getPnLColor = (pnl) => {
    if (pnl > 0) return 'pnl-positive';
    if (pnl < 0) return 'pnl-negative';
    return 'pnl-neutral';
  };

  if (loading) {
    return (
      <div className="trade-history-loading">
        <RefreshCw className="spinning" size={32} />
        <p>Loading trade history...</p>
      </div>
    );
  }

  return (
    <div className="trade-history">
      <div className="trade-history-header">
        <h2>Trade History</h2>
        <div className="header-actions">
          <button className="btn-icon" onClick={loadTrades} title="Refresh">
            <RefreshCw size={18} />
          </button>
          <button 
            className="btn-secondary" 
            onClick={exportToCSV}
            disabled={filteredTrades.length === 0}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Trades</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card stat-positive">
          <div className="stat-label">
            <TrendingUp size={16} />
            Profitable
          </div>
          <div className="stat-value">{stats.profitable}</div>
        </div>
        <div className="stat-card stat-negative">
          <div className="stat-label">
            <TrendingDown size={16} />
            Losing
          </div>
          <div className="stat-value">{stats.losing}</div>
        </div>
        <div className={`stat-card ${stats.totalPnL >= 0 ? 'stat-positive' : 'stat-negative'}`}>
          <div className="stat-label">Total P&L</div>
          <div className="stat-value">₹{stats.totalPnL.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Win Rate</div>
          <div className="stat-value">{stats.winRate.toFixed(1)}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section" ref={filtersSectionRef}>
        <div className="filters-header">
          <div className="filters-title">
            <Filter size={18} />
            Filters
          </div>
          <button className="btn-link" onClick={resetFilters}>
            Reset All
          </button>
        </div>
        
        <div className="filters-grid">
          <div className="filter-group">
            <label>Index</label>
            <select value={filterIndex} onChange={(e) => setFilterIndex(e.target.value)}>
              <option value="ALL">All Indices</option>
              <option value="BANKNIFTY">BANKNIFTY</option>
              <option value="NIFTY">NIFTY</option>
              <option value="SENSEX">SENSEX</option>
              <option value="BANKEX">BANKEX</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
              <option value="EXITED">Exited</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Side</label>
            <select value={filterSignal} onChange={(e) => setFilterSignal(e.target.value)}>
              <option value="ALL">All Signals</option>
              <option value="CE">CE</option>
              <option value="PE">PE</option>
            </select>
          </div>

          <div className="filter-group">
            <label>
              <Calendar size={14} />
              From Date
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              ref={dateFromInputRef}
            />
          </div>

          <div className="filter-group">
            <label>
              <Calendar size={14} />
              To Date
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Trades Table */}
      <div className="trades-table-container">
        {filteredTrades.length === 0 ? (
          <div className="empty-state">
            <p>No trades found matching the selected filters</p>
            {(filterIndex !== 'ALL' || filterStatus !== 'ALL' || filterSignal !== 'ALL' || dateFrom || dateTo) && (
              <button className="btn-secondary" onClick={resetFilters}>
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table className="trades-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Index</th>
                <th>Symbol</th>
                <th>Mode</th>
                <th>Signal</th>
                <th>Qty</th>
                <th>Entry Price</th>
                <th>Exit Price</th>
                <th>P&L</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade, idx) => (
                <tr key={trade.id || idx}>
                  <td className="time-cell">
                    {safeFormat(trade.entry_time, 'MMM dd, yyyy')}
                    <br />
                    <small>{safeFormat(trade.entry_time, 'HH:mm:ss', '')}</small>
                  </td>
                  <td><span className="index-badge">{trade.index_name}</span></td>
                  <td className="symbol-cell">{trade.symbol}</td>
                  <td>
                    <span className={`mode-badge ${trade.paper_mode ? 'mode-paper' : 'mode-live'}`}>
                      {trade.paper_mode ? 'Paper' : 'Live'}
                    </span>
                  </td>
                  <td>
                    <span className={`signal-badge signal-${safeLower(normalizeOptionType(trade.option_type), '')}`}>
                      {normalizeOptionType(trade.option_type) || '—'}
                    </span>
                  </td>
                  <td>{trade.quantity}</td>
                  <td>₹{trade.entry_price}</td>
                  <td>{trade.exit_price ? `₹${trade.exit_price}` : '-'}</td>
                  <td className={getPnLColor(trade.pnl)}>
                    {trade.pnl ? `₹${trade.pnl.toFixed(2)}` : '-'}
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadge(trade.status)}`}>
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="trade-history-footer">
        <p>Showing {filteredTrades.length} of {trades.length} trades</p>
        <small>Data from PostgreSQL database</small>
      </div>
    </div>
  );
});

export default TradeHistory;
