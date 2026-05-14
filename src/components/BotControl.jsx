import { useEffect, useMemo, useState } from 'react';
import { Play, Square, Settings, CheckCircle, Circle, Activity } from 'lucide-react';
import { tradingAPI } from '../services/api';
import ThresholdIndicators from './ThresholdIndicators';
import './BotControl.css';

function clamp01(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Math.max(0, Math.min(1, num));
}

function formatNum(value, digits = 4) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(digits) : '—';
}

function formatMoney(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(digits) : '—';
}

function MetricBar({ label, valueText, fraction, variant = 'blue' }) {
  return (
    <div className="viz-row">
      <div className="viz-label">{label}</div>
      <div className="viz-bar" aria-hidden="true">
        <div className={`viz-fill ${variant}`} style={{ width: `${Math.round(clamp01(fraction) * 100)}%` }} />
      </div>
      <div className="viz-value">{valueText}</div>
    </div>
  );
}

function BotControl({ bots, mabState, lockedSnapshots, initialized, onInitialize, onRefresh }) {
  const PAPER_MODE_STORAGE_KEY = 'tradevault_paper_mode_preference';
  const [selectedIndices, setSelectedIndices] = useState(['BANKNIFTY', 'NIFTY', 'SENSEX', 'BANKEX']);
  const [loading, setLoading] = useState(false);
  const [paperMode, setPaperMode] = useState(() => {
    try {
      const stored = localStorage.getItem(PAPER_MODE_STORAGE_KEY);
      if (stored === 'live') return false;
      if (stored === 'paper') return true;
    } catch {
      // ignore
    }
    return true; // Default to paper mode for safety
  });

  // Convert bots to array if it's an object, and guard against malformed payloads
  const botsListRaw = useMemo(() => (Array.isArray(bots) ? bots : Object.values(bots || {})), [bots]);
  const botsList = useMemo(
    () => botsListRaw.filter((b) => b && typeof b === 'object'),
    [botsListRaw]
  );

  const modeSummary = useMemo(() => {
    if (!botsList || botsList.length === 0) return null;
    const modes = new Set(botsList.map((b) => (b.paper_mode !== false ? 'paper' : 'live')));
    if (modes.size !== 1) return 'mixed';
    return modes.has('paper') ? 'paper' : 'live';
  }, [botsList]);

  // Persist user preference across navigation.
  useEffect(() => {
    try {
      localStorage.setItem(PAPER_MODE_STORAGE_KEY, paperMode ? 'paper' : 'live');
    } catch {
      // ignore
    }
  }, [paperMode]);

  // If user hasn't chosen yet, and bots already exist in a single mode, default to that mode.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PAPER_MODE_STORAGE_KEY);
      if (stored) return;
    } catch {
      // ignore
    }
    if (modeSummary === 'paper') setPaperMode(true);
    if (modeSummary === 'live') setPaperMode(false);
  }, [modeSummary]);
  
  console.log('[BotControl DEBUG] initialized:', initialized);
  console.log('[BotControl DEBUG] bots:', bots);

  const handleInitialize = async () => {
    setLoading(true);
    try {
      const initRes = await onInitialize(selectedIndices, paperMode); // Pass paper mode setting
      const warnings = initRes?.warnings;
      if (Array.isArray(warnings) && warnings.length > 0) {
        alert(`Initialization warnings:\n\n- ${warnings.join('\n- ')}`);
      }
    } catch (error) {
      console.error('Error initializing:', error);
      alert('Failed to initialize: ' + (error?.response?.data?.detail || error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (index = null) => {
    setLoading(true);
    try {
      await tradingAPI.start(index ? [index] : null);
      await onRefresh?.();
    } catch (error) {
      console.error('Error starting:', error);
      alert('Failed to start trading');
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async (index = null) => {
    setLoading(true);
    try {
      await tradingAPI.stop(index ? [index] : null);
      await onRefresh?.();
    } catch (error) {
      console.error('Error stopping:', error);
      alert('Failed to stop trading');
    } finally {
      setLoading(false);
    }
  };

  const handleExit = async (index) => {
    if (!index) return;
    
    // Confirm exit action
    if (!window.confirm(`Are you sure you want to exit the position for ${index}?`)) {
      return;
    }
    
    setLoading(true);
    try {
      // Force=true so user can exit even if bot is stopped.
      const response = await tradingAPI.executeTrade(index, 'EXIT', true);
      
      // Show success message
      alert(`✅ ${response.message || 'Position exited successfully!'}\n\nThe position will appear in your trade history once validated by the system.`);
      
      await onRefresh?.();
    } catch (error) {
      console.error('Error exiting:', error);
      const errorMsg = error?.response?.data?.detail || error.message || 'Unknown error';
      
      // Show user-friendly error with market status if applicable
      if (errorMsg.includes('Market is closed')) {
        alert('🔴 Market Closed\n\n' + errorMsg);
      } else {
        alert('❌ Failed to exit position\n\n' + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleIndex = (index) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  if (!initialized) {
    return (
      <div className="card bot-control">
        <div className="bot-control-header">
          <Settings size={20} />
          <h2>Initialize Trading Bots</h2>
        </div>
        
        <div className="init-grid">
          {/* Index Selection Tile */}
          <div className="init-tile">
            <div className="init-tile-header">
              <h3>Select Indices</h3>
              <span className="tile-badge">{selectedIndices.length} selected</span>
            </div>
            <div className="index-selector">
              {['BANKNIFTY', 'NIFTY', 'SENSEX', 'BANKEX'].map((index) => (
                <button
                  key={index}
                  className={`index-btn ${selectedIndices.includes(index) ? 'selected' : ''}`}
                  onClick={() => toggleIndex(index)}
                >
                  {selectedIndices.includes(index) ? (
                    <CheckCircle size={16} />
                  ) : (
                    <Circle size={16} />
                  )}
                  <span>{index}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Trading Mode Tile */}
          <div className="init-tile mode-tile">
            <div className="init-tile-header">
              <h3>Trading Mode</h3>
              <label className="mode-toggle">
                <input 
                  type="checkbox" 
                  checked={!paperMode}
                  onChange={(e) => setPaperMode(!e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className={`mode-indicator ${paperMode ? 'paper' : 'live'}`}>
              <div className="mode-icon">{paperMode ? '📄' : '💰'}</div>
              <div className="mode-details">
                <div className="mode-label">{paperMode ? 'Paper Mode' : 'Live Trading'}</div>
                <div className="mode-description">
                  {paperMode ? 'Simulates trades without real money' : 'Uses real money from broker'}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <button
          className="btn btn-primary btn-block"
          onClick={handleInitialize}
          disabled={loading || selectedIndices.length === 0}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Initializing...
            </>
          ) : (
            <>
              <Play size={18} />
              Initialize Bots
            </>
          )}
        </button>
      </div>
    );
  }
  
  const mabByIndex = mabState && typeof mabState === 'object' ? mabState : null;

  return (
    <div className="card bot-control">
      <div className="bot-control-header">
        <div className="header-left">
          <Settings size={20} />
          <h2>Bot Control</h2>
        </div>
        <div className={`mode-badge ${modeSummary}`}>
          {modeSummary === 'paper' ? '📄 PAPER' : modeSummary === 'live' ? '💰 LIVE' : '🟧 MIXED'}
        </div>
      </div>

      <div className="bot-update-section">
        <p className="section-description">
          Add indices or switch mode below. To change mode for specific index, stop it first.
        </p>

        <div className="update-grid">
          <div className="update-tile">
            <div className="tile-label">Indices ({selectedIndices.length}/4)</div>
            <div className="index-selector-compact">
              {['BANKNIFTY', 'NIFTY', 'SENSEX', 'BANKEX'].map((index) => (
                <button
                  key={index}
                  className={`index-chip ${selectedIndices.includes(index) ? 'selected' : ''}`}
                  onClick={() => toggleIndex(index)}
                  type="button"
                >
                  {selectedIndices.includes(index) && <CheckCircle size={14} />}
                  <span>{index}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="update-tile">
            <div className="tile-label">Mode</div>
            <div className="mode-selector">
              <label className="mode-toggle">
                <input
                  type="checkbox"
                  checked={!paperMode}
                  onChange={(e) => setPaperMode(!e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
              <div className={`mode-text ${paperMode ? 'paper' : 'live'}`}>
                {paperMode ? '📄 Paper' : '💰 Live'}
              </div>
            </div>
          </div>
        </div>

        <button
          className="btn btn-primary btn-block"
          onClick={handleInitialize}
          disabled={loading || selectedIndices.length === 0}
          type="button"
          style={{ marginTop: '16px' }}
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              Updating...
            </>
          ) : (
            <>
              <Play size={18} />
              Update Bots
            </>
          )}
        </button>
      </div>
      
      <div className="bot-list">
        {botsList.length === 0 ? (
          <div className="bot-empty-state">
            {botsListRaw.length > 0
              ? 'Received unexpected bot status payload. Please click Refresh.'
              : 'Bots initialized but no status received yet. Please wait a few seconds or click refresh.'}
          </div>
        ) : (
          botsList.map((bot) => (
            <div key={bot.index} className="bot-item">
              <div className="bot-info">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div className="bot-name">{bot.index}</div>
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: '600',
                    background: bot.paper_mode !== false ? 'rgba(156, 39, 176, 0.2)' : 'rgba(76, 175, 80, 0.2)',
                    color: bot.paper_mode !== false ? '#ba68c8' : '#4caf50'
                  }}>
                    {bot.paper_mode !== false ? 'PAPER' : 'LIVE'}
                  </span>
                </div>
                <div className="bot-status">
                  <span className={`status-dot ${bot.running ? 'active' : 'inactive'}`}></span>
                  <span>{bot.running ? 'Running' : 'Stopped'}</span>
                </div>
                {bot.live_data && (
                  <div style={{ fontSize: '12px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', color: '#888' }}>
                      <div>
                        <span style={{ color: '#666' }}>Index:</span> ₹{Number(bot.live_data.index_price || 0).toFixed(2)}
                      </div>
                      {bot.live_data.regime && (
                        <div>
                          <span style={{ color: '#666' }}>Regime:</span> {bot.live_data.regime}
                        </div>
                      )}
                      {bot.mab_variant && (
                        <div>
                          <span style={{ color: '#666' }}>Strategy:</span> {bot.mab_variant}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="bot-position">
                  Position: <span className="position-value">
                    {bot.current_position ? (
                      typeof bot.current_position === 'object' ? 
                        `${bot.current_position.option_type || 'OPT'} ${bot.current_position.quantity || ''} Qty` : 
                        bot.current_position
                    ) : 'NONE'}
                  </span>
                  {bot.current_position && (
                    <span style={{
                      marginLeft: '8px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontWeight: '600',
                      background: 'rgba(255, 152, 0, 0.2)',
                      color: '#ff9800',
                      border: '1px solid rgba(255, 152, 0, 0.5)',
                      animation: 'pulse 2s ease-in-out infinite'
                    }}>
                      🔒 IN MARKET
                    </span>
                  )}
                </div>

                {bot.current_position && typeof bot.current_position === 'object' && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    fontSize: '12px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ color: '#aaa' }}>Entry</div>
                        <div style={{ fontWeight: 600 }}>₹{formatMoney(bot.current_position.entry_price)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#aaa' }}>Current</div>
                        <div style={{ fontWeight: 600 }}>₹{formatMoney(bot.current_position.current_ltp)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#aaa' }}>Stop Loss</div>
                        <div style={{ fontWeight: 600, color: '#f44336' }}>₹{formatMoney(bot.current_position.stop_loss_price)}</div>
                        <div style={{ color: '#888' }}>Δ {formatMoney(bot.current_position.distance_to_stop_loss)}</div>
                      </div>
                      <div>
                        <div style={{ color: '#aaa' }}>Target</div>
                        <div style={{ fontWeight: 600, color: '#4caf50' }}>₹{formatMoney(bot.current_position.target_price)}</div>
                        <div style={{ color: '#888' }}>Δ {formatMoney(bot.current_position.distance_to_target)}</div>
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#888', marginTop: '0.25rem' }}>
                  Trades: {bot.quota?.used || bot.trades_today || 0}/{bot.quota?.daily_limit || 5} | P&L: ₹{bot.current_pnl?.toFixed(2) || '0.00'}
                  {bot.quota && (
                    <span style={{ 
                      marginLeft: '8px', 
                      padding: '1px 6px', 
                      borderRadius: '4px', 
                      fontSize: '9px',
                      backgroundColor: bot.quota.can_trade ? '#1a472a' : '#6b1a1a',
                      color: bot.quota.can_trade ? '#4caf50' : '#ff4444'
                    }}>
                      {bot.quota.remaining > 0 ? `${bot.quota.remaining} left` : 'Quota reached'}
                    </span>
                  )}
                </div>
                
                {/* Threshold Indicators - Show real-time filter status */}
                {bot.metrics && (
                  <ThresholdIndicators 
                    metrics={bot.metrics} 
                    config={bot.config}
                  />
                )}
              </div>
              
              <div className="bot-actions">
                {bot.current_position ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleExit(bot.index)}
                      disabled={loading}
                      title="Exit the open position for this index"
                    >
                      <Square size={16} />
                      Exit
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleStop(bot.index)}
                      disabled={loading}
                      title="Stop the bot (does not automatically close position)"
                    >
                      <Square size={16} />
                      Stop
                    </button>
                  </div>
                ) : bot.running ? (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleStop(bot.index)}
                    disabled={loading}
                  >
                    <Square size={16} />
                    Stop
                  </button>
                ) : (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleStart(bot.index)}
                    disabled={loading}
                  >
                    <Play size={16} />
                    Start
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="bot-control-footer">
        <button
          className="btn btn-success"
          onClick={() => handleStart()}
          disabled={loading}
        >
          <Play size={18} />
          Start All
        </button>
        <button
          className="btn btn-danger"
          onClick={() => handleStop()}
          disabled={loading}
        >
          <Square size={18} />
          Stop All
        </button>
      </div>
    </div>
  );
}

export default BotControl;
