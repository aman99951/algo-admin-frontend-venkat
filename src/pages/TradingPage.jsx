import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BotControl from '../features/trading/BotControl';
import UserHeader from '../components/UserHeader';
import { useAuthStore } from '../store/store';
import './TradingPage.css';

export default function TradingPage() {
  const navigate = useNavigate();
  const { userInfo } = useAuthStore();
  const connected = userInfo?.connected === true;

  useEffect(() => {
    document.title = 'Trading - TradeVault';
  }, []);

  return (
    <div className="page-container trading-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trading</h1>
          <p className="page-subtitle">Bot control and live positions</p>
        </div>
        <UserHeader />
      </div>

      {!connected && (
        <div className="flow-banner">
          <div className="flow-text">Step 1: Connect your broker in Settings to enable trading.</div>
          <button className="flow-action" onClick={() => navigate('/settings')}>Go to Settings</button>
        </div>
      )}

      {/* Bot Control - Main Focus */}
      <div className="section bot-control-section">
        <BotControl />
      </div>
    </div>
  );
}
