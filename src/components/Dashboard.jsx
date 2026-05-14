import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useTradingStore, useUIStore } from '../store/store';
import { authAPI, tradingAPI, analyticsAPI } from '../services/api';
import { wsService } from '../services/websocket';
import Header from './Header';
import MetricsCards from './MetricsCards';
import LiveMarketPanel from './LiveMarketPanel';
import BotControl from './BotControl';
import PositionsTable from './PositionsTable';
import TradesTable from './TradesTable';
import PerformanceChart from './PerformanceChart';
import UserProfile from './UserProfile';
import SavedCredentialsBanner from './SavedCredentialsBanner';
import SafetyStats from './SafetyStats';
import { Database, AlertCircle } from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const navigate = useNavigate();
  const { clearSession, userInfo } = useAuthStore();
  const { bots, liveMetrics, setBots, setLiveMetrics, setTrades, addTrade, setTradingStatus } = useTradingStore();
  const { setConnected } = useUIStore();

  // Memoize computed values to prevent re-renders
  const hasActiveBots = useMemo(() => {
    return Array.isArray(bots) && bots.some(bot => bot.status === 'running');
  }, [bots]);

  const botsCount = useMemo(() => {
    return Array.isArray(bots) ? bots.length : 0;
  }, [bots]);
  
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState('');
  const [savedCredentials, setSavedCredentials] = useState([]);
  const [chartRefreshTrigger, setChartRefreshTrigger] = useState(0);

  // Load saved credentials on mount
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const response = await authAPI.getSavedCredentials();
      // Backend returns a plain array (List[SavedCredential]), not {credentials: [...]}
      setSavedCredentials(Array.isArray(response) ? response : (response.credentials || []));
    } catch (err) {
      console.warn('Could not load saved credentials:', err);
    }
  };

  // Normalize bot status responses before pushing into stores
  const syncStatusState = useCallback((statusRes) => {
    console.log('[DEBUG] syncStatusState called:', statusRes);
    if (!statusRes) {
      console.log('[DEBUG] syncStatusState: statusRes is null/undefined, returning early');
      return;
    }
    const hasBotsArray = Array.isArray(statusRes.bots);
    const safeBots = hasBotsArray ? statusRes.bots : null;
    console.log('[DEBUG] safeBots:', safeBots);
    console.log('[DEBUG] safeBots.length:', safeBots ? safeBots.length : 'n/a');
    console.log('[DEBUG] statusRes.initialized:', statusRes.initialized);

    setTradingStatus({
      tradingInitialized: statusRes.initialized === true,
      tradingStatusUpdatedAt: new Date().toISOString(),
      tradingStatusError: null,
    });

    // Only clear bots when backend explicitly says uninitialized.
    if (statusRes.initialized === false) {
      setBots([]);
      setInitialized(false);
      return;
    }

    // When initialized, prefer keeping last known bots if bots payload is missing/empty.
    if (hasBotsArray && safeBots.length > 0) {
      setBots(safeBots);
    }

    const shouldBeInitialized = Boolean(statusRes.initialized);
    console.log('[DEBUG] Setting initialized to:', shouldBeInitialized);
    setInitialized(shouldBeInitialized);
    
    // Extra logging
    if (statusRes.initialized && (!safeBots || safeBots.length === 0)) {
      console.warn('[DEBUG] WARNING: Backend says initialized=true but bots array is empty!');
    }
    if (!statusRes.initialized && safeBots && safeBots.length > 0) {
      console.warn('[DEBUG] WARNING: Backend says initialized=false but bots array has items!');
    }
  }, [setBots, setTradingStatus]);


  const loadInitialData = async () => {
    try {
      setError('');
      console.log('[DEBUG] 🔄 Loading dashboard data...');
      // Get bot status
      try {
        const statusRes = await tradingAPI.getStatus();
        console.log('[DEBUG] ✅ Bot status response:', statusRes);
        console.log('[DEBUG] Bot status response stringified:', JSON.stringify(statusRes, null, 2));
        syncStatusState(statusRes);
        if (!statusRes.initialized || !statusRes.bots || statusRes.bots.length === 0) {
          console.log('[DEBUG] ℹ️ No bots initialized yet. User needs to initialize.');
          console.log('[DEBUG] statusRes.initialized:', statusRes.initialized);
          console.log('[DEBUG] statusRes.bots:', statusRes.bots);
        } else {
          console.log('[DEBUG] ✅ Bots ARE initialized! Count:', statusRes.bots.length);
        }
      } catch (err) {
        let msg = err?.response?.data?.detail || err.message || 'Could not load bot status.';
        if (Array.isArray(msg)) msg = msg.map(m => m.msg).join(', ');
        setError(`Bot status error: ${msg}`);
        console.warn('[DEBUG] ⚠️ Could not load bot status:', msg);
        console.error('[DEBUG] Full error object:', err);
      }
      // Get live metrics
      try {
        const metricsRes = await analyticsAPI.getLiveMetrics();
        console.log('[DEBUG] ✅ Live metrics:', metricsRes);
        setLiveMetrics(metricsRes.metrics || {});
      } catch (err) {
        setError(prev => prev ? prev + '\nMetrics error: ' + (err.message || '') : 'Metrics error: ' + (err.message || ''));
        console.warn('[DEBUG] ⚠️ Could not load metrics:', err.message);
        setLiveMetrics({});
      }
      // Get recent trades
      try {
        const tradesRes = await tradingAPI.getTrades();
        console.log('[DEBUG] ✅ Trades:', tradesRes);
        setTrades(tradesRes.trades || []);
      } catch (err) {
        setError(prev => prev ? prev + '\nTrades error: ' + (err.message || '') : 'Trades error: ' + (err.message || ''));
        console.warn('[DEBUG] ⚠️ Could not load trades:', err.message);
        setTrades([]);
      }
      console.log('[DEBUG] ✅ Dashboard loaded successfully');
      setLoading(false);
    } catch (error) {
      setError('Dashboard error: ' + (error.message || 'Unknown error'));
      console.error('[DEBUG] ❌ Error loading dashboard:', error);
      setLoading(false);
    }
  };

  const refreshData = useCallback(async () => {
    try {
      const metricsRes = await analyticsAPI.getLiveMetrics();
      setLiveMetrics(metricsRes.metrics || {});
      
      // Also refresh trades to keep table in sync
      const tradesRes = await tradingAPI.getTrades();
      setTrades(tradesRes.trades || []);
    } catch (error) {
      console.error('Error refreshing data:', error.message);
    }

    try {
      const statusRes = await tradingAPI.getStatus();
      syncStatusState(statusRes);
    } catch (error) {
      console.error('Error refreshing bot status:', error.message);
    }
  }, [setLiveMetrics, syncStatusState]);

  const setupWebSocket = () => {
    // Listen for bot status updates
    wsService.on('bot_status', (data) => {
      console.log('[WebSocket] Received bot_status:', data);
      
      // Ensure data is in correct format for BotControl
      const botData = {
        ...data,
        live_data: {
          index_price: data.metrics?.price || 0,
          decision: data.decision,
          reason: data.reason,
        },
        metrics: data.metrics,  // Pass metrics for ThresholdIndicators
        config: data.config,     // Pass config for thresholds
        current_pnl: data.pnl || 0,
      };
      
      // Update the specific bot in the array, don't replace the whole array
      setBots(prevBots => {
        const botIndex = prevBots.findIndex(b => b.index === botData.index);
        if (botIndex >= 0) {
          // Update existing bot
          const updated = [...prevBots];
          updated[botIndex] = botData;
          return updated;
        } else {
          // Add new bot
          return [...prevBots, botData];
        }
      });
    });
    
    // Listen for new trades
    wsService.on('trade', (data) => {
      addTrade(data);
    });
    
    // Listen for PnL updates
    wsService.on('pnl', (data) => {
      setLiveMetrics((prev) => ({
        ...prev,
        today_pnl: data.pnl,
      }));
    });
    
    // Listen for metrics updates (when trades close)
    wsService.on('metrics_update', (data) => {
      console.log('[WebSocket] Received metrics_update:', data);
      
      // Update live metrics with fresh data from database
      setLiveMetrics((prev) => ({
        ...prev,
        today_pnl: data.today_pnl,
        today_closed_pnl: data.today_closed_pnl,
        today_open_pnl: data.today_open_pnl,
        today_trades: data.today_trades,
        active_positions: data.active_positions,
        win_rate: data.win_rate,
        orders_today: data.orders_today || prev.orders_today || 0,
        bots_running: data.bots_running !== undefined ? data.bots_running : prev.bots_running,
        total_bots: data.total_bots !== undefined ? data.total_bots : prev.total_bots,
      }));
      
      // Trigger chart refresh
      setChartRefreshTrigger(prev => prev + 1);
      
      // Show notification for closed trade
      if (data.trade_closed) {
        console.log(`✅ Trade Closed: ${data.trade_closed.index} - P&L: ₹${data.trade_closed.pnl?.toFixed(2) || 0}`);
      }
    });
  };

  useEffect(() => {
    loadInitialData();
    setupWebSocket();
    
    const unsubscribeConnection = wsService.onConnectionChange((isConnected) => {
      setConnected(isConnected);
    });

    // Optimized polling: 10s for full status (reduces server load)
    const interval = setInterval(() => {
      refreshData();
    }, 10000);

    return () => {
      clearInterval(interval);
      unsubscribeConnection();
      wsService.disconnect();
    };
  }, [refreshData, setConnected]);

  const handleInitialize = async (indices, paperMode = true) => {
    try {
      console.log('[DEBUG] 🚀 Initializing bots for indices:', indices, 'Paper Mode:', paperMode);
      
      // LIVE TRADING CONFIRMATION: Show explicit warning before enabling live trading
      if (!paperMode) {
        const confirmed = window.confirm(
          '⚠️ LIVE TRADING CONFIRMATION\n\n' +
          'You are about to enable LIVE TRADING with REAL MONEY.\n\n' +
          '⚠️ This will place REAL orders on your broker account\n' +
          '💰 Real money will be at risk\n' +
          '📉 You can lose money if trades go against you\n\n' +
          'Are you absolutely sure you want to proceed with LIVE trading?'
        );
        
        if (!confirmed) {
          console.log('[DEBUG] ❌ User cancelled LIVE trading initialization');
          return; // User cancelled
        }
        console.log('[DEBUG] ✅ User confirmed LIVE trading');
      }
      
      // When going live, we need to explicitly confirm
      const confirmLive = !paperMode;
      const initRes = await tradingAPI.initialize(indices, paperMode, confirmLive);
      console.log('[DEBUG] ✅ Initialize response:', initRes);
      
      if (!initRes.success) {
        throw new Error(initRes.message || 'Initialization failed');
      }
      
      // Wait a moment for backend to fully initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const statusRes = await tradingAPI.getStatus();
      console.log('[DEBUG] ✅ Status response after init:', statusRes);
      console.log('[DEBUG] statusRes.initialized:', statusRes.initialized);
      console.log('[DEBUG] statusRes.bots:', statusRes.bots);
      console.log('[DEBUG] statusRes.bots.length:', statusRes.bots?.length);
      
      if (statusRes.initialized && statusRes.bots && statusRes.bots.length > 0) {
        console.log('[DEBUG] ✅ Setting bots:', statusRes.bots);
        syncStatusState(statusRes);
        const modeText = paperMode ? '📄 PAPER MODE' : '💰 LIVE TRADING';
        alert(`✅ Successfully initialized ${statusRes.bots.length} bot(s) in ${modeText} for: ${statusRes.bots.map(b => b.index).join(', ')}. Page will reload to refresh UI.`);
        // Force reload to ensure fresh state
        setTimeout(() => window.location.reload(), 1000);
      } else {
        console.warn('[DEBUG] ⚠️ No bots returned in status after initialization');
        console.warn('[DEBUG] Status response:', JSON.stringify(statusRes, null, 2));
        alert(`⚠️ Initialization completed but no bots found in status. Response: ${JSON.stringify(statusRes)}`);
      }
    } catch (error) {
      console.error('[DEBUG] ❌ Error initializing bots:', error);
      alert(`❌ Failed to initialize bots: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      wsService.disconnect();
      clearSession();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
        {error && (
          <div className="error-message" style={{ color: 'red', marginTop: '1rem' }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  // Debug render
  console.log('[DEBUG RENDER] initialized:', initialized);
  console.log('[DEBUG RENDER] bots:', bots);
  console.log('[DEBUG RENDER] liveMetrics:', liveMetrics);
  console.log('[DEBUG RENDER] error:', error);

  return (
    <div className="dashboard">
      <UserProfile />
      <Header userInfo={userInfo} onLogout={handleLogout} />
      <div className="dashboard-content">
        {error && (
          <div className="error-message" style={{ color: 'red', marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        
        <SavedCredentialsBanner credentialCount={savedCredentials.length} />
        
        <SafetyStats />
        
        {/* Welcome message for first-time users */}
        {!initialized && !error && (
          <div className="card" style={{ 
            padding: '2rem', 
            marginBottom: '1.5rem', 
            background: 'linear-gradient(135deg, var(--accent-blue) 0%, var(--accent-purple) 100%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <h2 style={{ marginBottom: '0.5rem', fontSize: '1.8rem' }}> Welcome to TradeVault!</h2>
            <p style={{ marginBottom: '1rem', opacity: 0.9 }}>
              You're logged in as <strong>{userInfo?.user_name || userInfo?.user_id || 'Trader'}</strong> ({userInfo?.broker || 'Unknown Broker'})
            </p>
            <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.95 }}>
               <strong>Next Step:</strong> Initialize your trading bots below to start trading!
            </p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
               Select the indices you want to trade (BANKNIFTY, NIFTY) and click "Initialize Bots"
            </p>
          </div>
        )}
        {/* Top Section: Metrics Cards */}
        <MetricsCards metrics={liveMetrics} />
        
        {/* Live Market Panel (if trading) */}
        {initialized && liveMetrics && liveMetrics.index_name && (
           <div className="live-panels-container">
             <LiveMarketPanel 
               key={liveMetrics.index_name} 
               indexName={liveMetrics.index_name} 
               metrics={liveMetrics} 
             />
           </div>
        )}
        
        {/* Main Content Grid: Bot Control + Positions */}
        <div className="dashboard-main-grid">
          {/* Left Column: Bot Control */}
          <div className="bot-control-section">
            <BotControl
              bots={bots}
              initialized={initialized}
              onInitialize={handleInitialize}
            />
          </div>
          
          {/* Right Column: Positions & Performance */}
          <div className="positions-performance-section">
            {/* Open Positions (Higher Priority) */}
            <div className="section-card">
              <PositionsTable />
            </div>
            
            {/* Performance Chart */}
            <div className="section-card">
              <PerformanceChart refreshTrigger={chartRefreshTrigger} />
            </div>
          </div>
        </div>
        
        {/* Bottom Section: Trade History (Full Width) */}
        <div className="trades-section">
          <TradesTable />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
