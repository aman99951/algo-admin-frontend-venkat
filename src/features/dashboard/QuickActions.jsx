import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Activity } from 'lucide-react';
import { tradingAPI } from '../../services/api';
import { useTradingStore } from '../../store/store';
import './QuickActions.css';

export default function QuickActions() {
  const navigate = useNavigate();
  const { bots, setBots, tradingInitialized, setTradingStatus } = useTradingStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Optimized polling
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      const statusRes = await tradingAPI.getStatus();
      setTradingStatus({
        tradingInitialized: statusRes?.initialized === true,
        tradingStatusUpdatedAt: new Date().toISOString(),
        tradingStatusError: null,
      });

      if (statusRes?.initialized === false) {
        setBots([]);
      } else if (Array.isArray(statusRes?.bots)) {
        setBots(statusRes.bots);
      }
    } catch (err) {
      console.error('Failed to get status:', err);
      setTradingStatus({
        tradingStatusUpdatedAt: new Date().toISOString(),
        tradingStatusError: err?.message || 'Failed to fetch status',
      });
    }
  };

  const handleStartBot = async () => {
    setLoading(true);
    try {
      const statusRes = await tradingAPI.getStatus();
      
      if (!statusRes.initialized || !statusRes.bots || statusRes.bots.length === 0) {
        alert('Please initialize bots first from the Trading page');
        navigate('/trading');
        return;
      }
      
      await tradingAPI.start(null);
      await checkStatus();
      alert('Bot started successfully!');
    } catch (err) {
      console.error('Failed to start bot:', err);
      alert('Failed to start bot: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleStopBot = async () => {
    setLoading(true);
    try {
      await tradingAPI.stop(null);
      await checkStatus();
      alert('Bot stopped successfully!');
    } catch (err) {
      console.error('Failed to stop bot:', err);
      alert('Failed to stop bot: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const isRunning = bots.some(bot => bot.running);
  const isInitialized = tradingInitialized || bots.length > 0;

  return (
    <div className="quick-actions">
      <div className="section-header">
        <Activity size={20} />
        <h3>Quick Controls</h3>
        {isRunning && <span className="status-badge running">● Running</span>}
        {!isRunning && isInitialized && <span className="status-badge stopped">● Stopped</span>}
        {!isInitialized && <span className="status-badge not-init">● Not Initialized</span>}
      </div>

      <div className="actions-grid">
        <button className="action-card start" onClick={handleStartBot} disabled={loading || isRunning || !isInitialized}>
          <div className="action-icon">
            <Play size={24} fill="currentColor" />
          </div>
          <div className="action-text">
            <span className="action-title">{loading ? 'Starting...' : 'Start Bot'}</span>
            <span className="action-desc">Begin trading</span>
          </div>
        </button>

        <button className="action-card stop" onClick={handleStopBot} disabled={loading || !isRunning}>
          <div className="action-icon">
            <Square size={24} fill="currentColor" />
          </div>
          <div className="action-text">
            <span className="action-title">{loading ? 'Stopping...' : 'Stop Bot'}</span>
            <span className="action-desc">Halt trading</span>
          </div>
        </button>
      </div>

      {!isInitialized && (
        <div className="init-notice">
          <p>
            Go to{' '}
            <button className="init-link" onClick={() => navigate('/trading')}>Trading</button>
            {' '}to initialize bots first
          </p>
        </div>
      )}
    </div>
  );
}
