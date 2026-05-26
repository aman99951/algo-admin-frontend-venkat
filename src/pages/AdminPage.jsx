import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Users, Database, Activity, Server, Coins, RefreshCw, Plus, Minus } from 'lucide-react';
import './AdminPage.css';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Users data
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  
  // Credit adjustment
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  
  // Database status
  const [dbStatus, setDbStatus] = useState(null);
  
  // Market data
  const [marketData, setMarketData] = useState([]);
  const [marketFilter, setMarketFilter] = useState('');
  
  // Redis sessions
  const [redisData, setRedisData] = useState(null);

  // Table data browser
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState(null);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableOffset, setTableOffset] = useState(0);
  
  // Admin key
  const [adminKey, setAdminKey] = useState(adminAPI.getAdminKey());

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      switch (activeTab) {
        case 'users':
          const usersData = await adminAPI.getUsers();
          setUsers(usersData.users || []);
          break;
        case 'database':
          const dbData = await adminAPI.getDbStatus();
          setDbStatus(dbData);
          break;
        case 'marketdata':
          const market = await adminAPI.getMarketData(marketFilter || null);
          setMarketData(market.data || []);
          break;
        case 'redis':
          const redis = await adminAPI.getRedisSessions();
          setRedisData(redis);
          break;
        default:
          break;
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    setSelectedUser(userId);
    try {
      const detail = await adminAPI.getUserDetail(userId);
      setUserDetail(detail);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAdjustCredits = async () => {
    if (!adjustUserId || !adjustAmount || !adjustReason) {
      setError('Please fill in user ID, amount, and reason');
      return;
    }
    
    setAdjustLoading(true);
    setError(null);
    try {
      const result = await adminAPI.adjustCredits(
        adjustUserId, 
        parseInt(adjustAmount), 
        adjustReason, 
        adjustNote
      );
      alert(`Credits adjusted! New balance: ${result.balance}`);
      setAdjustAmount('');
      setAdjustReason('');
      setAdjustNote('');
      loadData(); // Refresh users
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to adjust credits');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleViewTable = async (tableName, offset = 0) => {
    setSelectedTable(tableName);
    setTableOffset(offset);
    setTableLoading(true);
    setError(null);
    try {
      const data = await adminAPI.getTableData(tableName, 50, offset);
      setTableData(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load table data');
    } finally {
      setTableLoading(false);
    }
  };

  const handleSaveAdminKey = () => {
    adminAPI.setAdminKey(adminKey);
    alert('Admin key saved! Reloading data...');
    loadData();
  };

  const getCreditBadgeClass = (balance) => {
    if (balance >= 1000) return 'high';
    if (balance >= 100) return 'medium';
    if (balance > 0) return 'low';
    return 'zero';
  };

  const tabs = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'marketdata', label: 'Market Data', icon: Activity },
    { id: 'redis', label: 'Redis', icon: Server },
  ];

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-key-input">
          <input 
            type="text" 
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="Admin Key"
          />
          <button onClick={handleSaveAdminKey}>Save Key</button>
        </div>
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-content">
        {error && <div className="admin-error">{error}</div>}
        
        {loading ? (
          <div className="admin-loading">Loading...</div>
        ) : (
          <>
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="users-section">
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Broker</th>
                        <th>Credits</th>
                        <th>Trades Left</th>
                        <th>Purchases</th>
                        <th>Connections</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.user_id}>
                          <td><strong>{user.user_id}</strong></td>
                          <td>{user.name || '-'}</td>
                          <td>{user.email || '-'}</td>
                          <td>{user.broker || '-'}</td>
                          <td>
                            <span className={`credit-badge ${getCreditBadgeClass(user.credits.balance)}`}>
                              {user.credits.balance}
                            </span>
                          </td>
                          <td>{user.credits.trades_remaining}</td>
                          <td>{user.purchases.count} (₹{user.purchases.total_spent_inr})</td>
                          <td>{user.broker_connections}</td>
                          <td>
                            <button className="btn-sm btn-primary" onClick={() => handleViewUser(user.user_id)}>
                              View
                            </button>
                            <button className="btn-sm btn-success" onClick={() => setAdjustUserId(user.user_id)}>
                              +Credits
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="adjust-credits-section">
                  <h3>Adjust User Credits</h3>
                  <div className="adjust-form">
                    <input 
                      type="text" 
                      placeholder="User ID"
                      value={adjustUserId}
                      onChange={(e) => setAdjustUserId(e.target.value)}
                    />
                    <input 
                      type="number" 
                      placeholder="Amount (+ to add, - to remove)"
                      value={adjustAmount}
                      onChange={(e) => setAdjustAmount(e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="Reason"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="Note (optional)"
                      value={adjustNote}
                      onChange={(e) => setAdjustNote(e.target.value)}
                    />
                    <button 
                      className="btn-success" 
                      onClick={handleAdjustCredits}
                      disabled={adjustLoading}
                    >
                      {adjustLoading ? 'Processing...' : 'Apply'}
                    </button>
                  </div>
                </div>

                {selectedUser && userDetail && (
                  <div className="user-detail-modal">
                    <div className="modal-content">
                      <h3>User: {selectedUser}</h3>
                      <div className="detail-section">
                        <h4>Profile</h4>
                        <pre>{JSON.stringify(userDetail.profile, null, 2)}</pre>
                      </div>
                      <div className="detail-section">
                        <h4>Brokers</h4>
                        <p>{userDetail.brokers?.join(', ') || 'None'}</p>
                      </div>
                      <div className="detail-section">
                        <h4>Credit Account</h4>
                        <p>Balance: {userDetail.credit_account?.balance || 0}</p>
                        <p>Lifetime Purchased: {userDetail.credit_account?.lifetime_purchased || 0}</p>
                        <p>Lifetime Consumed: {userDetail.credit_account?.lifetime_consumed || 0}</p>
                      </div>
                      <button className="btn-primary" onClick={() => { setSelectedUser(null); setUserDetail(null); }}>
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Database Tab */}
            {activeTab === 'database' && dbStatus && (
              <div className="database-section">
                <div className="db-stats">
                  <div className="db-stat">
                    <span className="stat-label">Database Status</span>
                    <span className={`stat-value ${dbStatus.database_engine === 'connected' ? 'success' : 'error'}`}>
                      {dbStatus.database_engine}
                    </span>
                  </div>
                  <div className="db-stat">
                    <span className="stat-label">Tables</span>
                    <span className="stat-value">{dbStatus.tables_found}</span>
                  </div>
                  <div className="db-stat">
                    <span className="stat-label">Redis</span>
                    <span className={`stat-value ${dbStatus.redis?.connected ? 'success' : 'error'}`}>
                      {dbStatus.redis?.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <div className="db-stat">
                    <span className="stat-label">Redis Keys</span>
                    <span className="stat-value">{dbStatus.redis?.total_keys || 0}</span>
                  </div>
                </div>
                <div className="tables-list">
                  <h3>Database Tables</h3>
                  <div className="tables-grid">
                    {Object.entries(dbStatus.tables || {}).map(([name, count]) => (
                      <div
                        key={name}
                        className={`table-item ${selectedTable === name ? 'active' : ''}`}
                        onClick={() => handleViewTable(name)}
                      >
                        <span className="table-name">{name}</span>
                        <span className="table-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Table Data Modal */}
            {selectedTable && (
              <div className="table-data-modal" onClick={() => { setSelectedTable(null); setTableData(null); }}>
                <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <h3>Table: {selectedTable}</h3>
                    <button className="btn-close" onClick={() => { setSelectedTable(null); setTableData(null); }}>&times;</button>
                  </div>
                  {tableLoading ? (
                    <div className="admin-loading">Loading data...</div>
                  ) : tableData ? (
                    <>
                      <div className="table-data-meta">
                        <span>Total rows: <strong>{tableData.total_rows}</strong></span>
                        <span>Showing: <strong>{tableData.rows.length}</strong> (offset {tableData.offset})</span>
                      </div>
                      <div className="table-data-wrapper">
                        <table className="table-data-table">
                          <thead>
                            <tr>
                              {tableData.columns.map((col) => (
                                <th key={col}>{col}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {tableData.rows.map((row, i) => (
                              <tr key={i}>
                                {tableData.columns.map((col) => (
                                  <td key={col}>
                                    {row[col] === null ? <span className="null-value">NULL</span>
                                      : typeof row[col] === 'object' ? JSON.stringify(row[col])
                                      : String(row[col])}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="table-data-pagination">
                        <button
                          className="btn-sm btn-primary"
                          disabled={tableOffset === 0}
                          onClick={() => handleViewTable(selectedTable, Math.max(0, tableOffset - 50))}
                        >
                          Previous
                        </button>
                        <span>Page {Math.floor(tableOffset / 50) + 1} of {Math.ceil(tableData.total_rows / 50) || 1}</span>
                        <button
                          className="btn-sm btn-primary"
                          disabled={tableOffset + 50 >= tableData.total_rows}
                          onClick={() => handleViewTable(selectedTable, tableOffset + 50)}
                        >
                          Next
                        </button>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            )}

            {/* Market Data Tab */}
            {activeTab === 'marketdata' && (
              <div className="marketdata-section">
                <div className="market-filters">
                  <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)}>
                    <option value="">All Indices</option>
                    <option value="BANKNIFTY">BANKNIFTY</option>
                    <option value="NIFTY">NIFTY</option>
                    <option value="SENSEX">SENSEX</option>
                    <option value="BANKEX">BANKEX</option>
                  </select>
                  <button className="btn-primary" onClick={loadData}>
                    <RefreshCw size={16} /> Refresh
                  </button>
                </div>
                <table className="market-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Index</th>
                      <th>Mode</th>
                      <th>Close</th>
                      <th>High</th>
                      <th>Low</th>
                      <th>RSI</th>
                      <th>Regime</th>
                      <th>Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketData.map((d, i) => (
                      <tr key={i}>
                        <td>{d.timestamp ? new Date(d.timestamp).toLocaleTimeString() : '-'}</td>
                        <td><strong>{d.index_name}</strong></td>
                        <td>{d.mode}</td>
                        <td>{d.price_close?.toFixed(2) || '-'}</td>
                        <td>{d.price_high?.toFixed(2) || '-'}</td>
                        <td>{d.price_low?.toFixed(2) || '-'}</td>
                        <td>{d.rsi?.toFixed(2) || '-'}</td>
                        <td>{d.regime || '-'}</td>
                        <td>{d.decision_action || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {marketData.length === 0 && <p className="no-data">No market data available</p>}
              </div>
            )}

            {/* Redis Tab */}
            {activeTab === 'redis' && redisData && (
              <div className="redis-section">
                <div className="redis-stats">
                  <div className="redis-stat">
                    <span className="stat-label">Redis Version</span>
                    <span className="stat-value">{redisData.redis_version || '-'}</span>
                  </div>
                  <div className="redis-stat">
                    <span className="stat-label">Memory Used</span>
                    <span className="stat-value">{redisData.used_memory_human || '-'}</span>
                  </div>
                  <div className="redis-stat">
                    <span className="stat-label">Sessions</span>
                    <span className="stat-value">{redisData.session_count || 0}</span>
                  </div>
                  <div className="redis-stat">
                    <span className="stat-label">Bot States</span>
                    <span className="stat-value">{redisData.bot_count || 0}</span>
                  </div>
                </div>
                <div className="sessions-list">
                  <h3>Active Sessions</h3>
                  <table className="sessions-table">
                    <thead>
                      <tr>
                        <th>Session ID</th>
                        <th>User ID</th>
                        <th>Broker</th>
                        <th>Has Adapter</th>
                        <th>Last Activity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(redisData.sessions || {}).map(([sid, s]) => (
                        <tr key={sid}>
                          <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{sid.substring(0, 25)}...</td>
                          <td>{s.user_id || '-'}</td>
                          <td>{s.broker_type || '-'}</td>
                          <td>{s.has_adapter ? '✅' : '❌'}</td>
                          <td>{s.last_activity || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}