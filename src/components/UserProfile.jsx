import { useEffect, useState } from 'react';
import { User, Wallet, TrendingUp, LogOut, RefreshCw } from 'lucide-react';
import { authAPI } from '../services/api';
import './UserProfile.css';

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState('');
  const [telegramEnabled, setTelegramEnabled] = useState(false);

  useEffect(() => {
    fetchProfile();
    
    // Refresh balance every 30 seconds
    const interval = setInterval(() => {
      fetchProfile(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchProfile = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const data = await authAPI.getUserProfile();
      setProfile(data);
      setWhatsappNumber(data?.notification_settings?.whatsapp_number || '');
      setWhatsappEnabled(Boolean(data?.notification_settings?.whatsapp_alerts_enabled));
      setTelegramChatId(data?.notification_settings?.telegram_chat_id || '');
      setTelegramEnabled(Boolean(data?.notification_settings?.telegram_alerts_enabled));
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const saveWhatsAppSettings = async () => {
    try {
      await authAPI.updateUserProfile({
        whatsapp_number: whatsappNumber,
        whatsapp_alerts_enabled: whatsappEnabled,
      });
      alert('✅ WhatsApp alert settings saved');
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      alert(`❌ Failed to save WhatsApp settings: ${error.response?.data?.detail || error.message}`);
    }
  };

  const saveTelegramSettings = async () => {
    try {
      await authAPI.updateUserProfile({
        telegram_chat_id: telegramChatId,
        telegram_alerts_enabled: telegramEnabled,
      });
      alert('✅ Telegram alert settings saved');
    } catch (error) {
      console.error('Error saving Telegram settings:', error);
      alert(`❌ Failed to save Telegram settings: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('session_id');
    localStorage.removeItem('user_info');
    window.location.href = '/';
  };

  const formatCurrency = (value) => {
    if (!value) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercentage = (value) => {
    if (!value) return '0.0%';
    // Backend returns win_rate as a percentage (e.g., 65.0), not a fraction
    return `${Number(value).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="user-profile loading">
        <div className="profile-skeleton">
          <div className="skeleton-circle"></div>
          <div className="skeleton-text"></div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const { profile: userInfo, statistics, live_balance, broker } = profile;

  return (
    <div className="user-profile">
      <div className="profile-main">
        <div className="profile-avatar">
          <User size={24} />
        </div>
        
        <div className="profile-info">
          <div className="profile-name">
            {userInfo?.name || profile.user_id}
          </div>
          <div className="profile-broker">
            {broker}
          </div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-item balance">
          <div className="stat-icon">
            <Wallet size={18} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Available</div>
            <div className="stat-value">
              {formatCurrency(live_balance)}
              <button 
                className="refresh-btn" 
                onClick={() => fetchProfile(true)}
                disabled={refreshing}
              >
                <RefreshCw size={14} className={refreshing ? 'spinning' : ''} />
              </button>
            </div>
          </div>
        </div>

        <div className="stat-item pnl">
          <div className="stat-icon">
            <TrendingUp size={18} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total P&L</div>
            <div className={`stat-value ${statistics?.total_pnl >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(statistics?.total_pnl || 0)}
            </div>
          </div>
        </div>

        <div className="stat-item winrate">
          <div className="stat-content">
            <div className="stat-label">Win Rate</div>
            <div className="stat-value">
              {formatPercentage(statistics?.win_rate || 0)}
            </div>
          </div>
        </div>

        <div className="stat-item trades">
          <div className="stat-content">
            <div className="stat-label">Trades</div>
            <div className="stat-value">
              {statistics?.total_trades || 0}
            </div>
          </div>
        </div>
      </div>

      <div className="profile-section notification-settings">
        <h3 className="section-title">Notification Settings</h3>
        <div className="notif-field">
          <label className="notif-label">WhatsApp</label>
          <input 
            type="text" 
            className="notif-input" 
            placeholder="+91XXXXXXXXXX"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
          />
          <label className="notif-toggle">
            <input 
              type="checkbox" 
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
            />
            <span>Enable WhatsApp Alerts</span>
          </label>
          <button className="save-notif-btn" onClick={saveWhatsAppSettings}>
            Save WhatsApp Settings
          </button>
        </div>
        
        <div className="notif-field">
          <label className="notif-label">Telegram (Free!)</label>
          <input 
            type="text" 
            className="notif-input" 
            placeholder="Your Telegram Chat ID"
            value={telegramChatId}
            onChange={(e) => setTelegramChatId(e.target.value)}
          />
          <label className="notif-toggle">
            <input 
              type="checkbox" 
              checked={telegramEnabled}
              onChange={(e) => setTelegramEnabled(e.target.checked)}
            />
            <span>Enable Telegram Alerts</span>
          </label>
          <button className="save-notif-btn" onClick={saveTelegramSettings}>
            Save Telegram Settings
          </button>
          <small style={{ color: '#666', marginTop: '8px', display: 'block' }}>
            📱 <strong>How to get your Chat ID:</strong><br/>
            1. Start chat with @TradeVaultBot on Telegram<br/>
            2. Send /start command<br/>
            3. Bot will reply with your Chat ID<br/>
            4. Copy and paste it here
          </small>
        </div>
      </div>

      <button className="logout-btn" onClick={handleLogout} title="Logout">
        <LogOut size={18} />
      </button>
    </div>
  );
}

export default UserProfile;
