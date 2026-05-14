import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/store';
import { authAPI } from '../services/api';
import { User } from 'lucide-react';
import './UserHeader.css';

export default function UserHeader() {
  const { userInfo, setUserInfo } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [marketStatus, setMarketStatus] = useState({ open: false, message: '' });

  useEffect(() => {
    loadProfile();
    checkMarketStatus();
    // Check market status every minute
    const interval = setInterval(checkMarketStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadProfile = async () => {
    if (!localStorage.getItem('session_id')) return;
    try {
      setLoading(true);
      const data = await authAPI.getUserProfile();
      // Merge profile data with existing userInfo to preserve login-sourced fields
      // (e.g., positions, positions_summary) that /auth/users/me doesn't return
      setUserInfo((prev) => prev ? { ...prev, ...data } : data);
    } catch {
      // If profile fetch fails, do not show fake values.
    } finally {
      setLoading(false);
    }
  };

  const checkMarketStatus = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTime = hours * 60 + minutes;

    // Weekend check
    if (day === 0 || day === 6) {
      setMarketStatus({ open: false, message: 'Weekend' });
      return;
    }

    // Market hours: 9:15 AM to 3:30 PM IST
    const marketOpen = 9 * 60 + 15; // 9:15 AM
    const marketClose = 15 * 60 + 30; // 3:30 PM

    if (currentTime >= marketOpen && currentTime <= marketClose) {
      setMarketStatus({ open: true, message: 'Open' });
    } else if (currentTime < marketOpen) {
      setMarketStatus({ open: false, message: 'Pre-Market' });
    } else {
      setMarketStatus({ open: false, message: 'Closed' });
    }
  };

  const displayName = userInfo?.profile?.name || userInfo?.profile?.username || userInfo?.user_id;
  const displayId = userInfo?.user_id;
  const connected = !!displayId;

  return (
    <div className="user-header">
      <div className="market-status-badge" data-status={marketStatus.open ? 'open' : 'closed'}>
        <span className="status-dot"></span>
        <span className="status-text">{marketStatus.message}</span>
      </div>
      <div className="user-info">
        <div className="user-avatar">
          <User size={18} />
        </div>
        <div className="user-details">
          <div className="user-name">{loading ? 'Loading…' : connected ? displayName : 'Not connected'}</div>
          <div className="user-id">{connected ? `ID: ${displayId}` : ''}</div>
        </div>
      </div>
    </div>
  );
}
