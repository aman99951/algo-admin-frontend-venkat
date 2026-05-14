import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/store';
import { authAPI } from '../services/api';
import { 
  LayoutDashboard, 
  Activity, 
  TrendingUp, 
  Settings, 
  LogOut, 
  User,
  BarChart3,
  History,
  Shield,
  Coins
} from 'lucide-react';
import CreditsBadge from '../components/CreditsBadge';
import './MainLayout.css';

export default function MainLayout() {
  const { userInfo, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/trading', icon: Activity, label: 'Trading', description: 'Active bots & positions' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Overview & quick actions' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', description: 'Performance & insights' },
    { path: '/history', icon: History, label: 'History', description: 'Trade history' },
    { path: '/credits', icon: Coins, label: 'Credits', description: 'Balance & billing' },
    { path: '/settings', icon: Settings, label: 'Settings', description: 'Credentials & preferences' }
  ];

  return (
    <div className="main-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <TrendingUp className="logo-icon" size={28} />
            <h1 className="logo-text">TradeVault</h1>
            <span className="pro-badge">PRO</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="nav-icon" size={20} />
              <div className="nav-content">
                <span className="nav-label">{item.label}</span>
                <span className="nav-description">{item.description}</span>
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <CreditsBadge />
          <div className="user-info">
            <div className="user-avatar">
              <User size={18} />
            </div>
            <div className="user-details">
              <div className="user-name">{userInfo?.profile?.name || userInfo?.user_id || 'Not connected'}</div>
              <div className="user-broker">{userInfo?.broker || (userInfo?.connected ? 'Connected' : 'Not connected')}</div>
            </div>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
