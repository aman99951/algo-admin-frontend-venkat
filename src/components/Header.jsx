import { LogOut, User, Wifi, WifiOff, Key, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/store';
import './Header.css';

function Header({ userInfo, onLogout }) {
  const navigate = useNavigate();
  const isConnected = useUIStore((state) => state.isConnected);

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1>TradeVault</h1>
          <span className="header-badge">PRO</span>
        </div>
        
        <div className="header-right">
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`} title={isConnected ? "System Online" : "System Offline"}>
            {isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
            <span className="status-text">{isConnected ? 'Online' : 'Offline'}</span>
          </div>

          {userInfo && (
            <div className="user-info">
              <User size={18} />
              <span>{userInfo.user_name || userInfo.user_id}</span>
            </div>
          )}
          
          <button className="btn btn-secondary" onClick={() => navigate('/credentials')} title="Manage Credentials">
            <Key size={18} />
            Credentials
          </button>
          
          <button className="btn btn-secondary" onClick={() => navigate('/history')} title="Trade History">
            <History size={18} />
            History
          </button>
          
          <button className="btn btn-secondary" onClick={onLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
