import { useState, useEffect } from 'react';
import CredentialManager from '../features/settings/CredentialManager';
import UserProfile from '../features/settings/UserProfile';
import ThresholdIndicators from '../features/settings/ThresholdIndicators';
import SafetySettings from '../features/settings/SafetySettings';
import UserHeader from '../components/UserHeader';
import './SettingsPage.css';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('credentials');

  useEffect(() => {
    document.title = 'Settings - TradeVault';
  }, []);

  return (
    <div className="page-container settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and trading preferences</p>
        </div>
        <UserHeader />
      </div>

      <div className="settings-layout">
        {/* Settings Sidebar */}
        <div className="settings-sidebar">
          <button
            className={`settings-nav-item ${activeSection === 'credentials' ? 'active' : ''}`}
            onClick={() => setActiveSection('credentials')}
          >
            <span>Broker Credentials</span>
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <span>Profile</span>
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'thresholds' ? 'active' : ''}`}
            onClick={() => setActiveSection('thresholds')}
          >
            <span>Thresholds</span>
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'safety' ? 'active' : ''}`}
            onClick={() => setActiveSection('safety')}
          >
            <span>Safety Settings</span>
          </button>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {activeSection === 'credentials' && (
            <div className="section">
              <h2 className="section-title">Broker Credentials</h2>
              <p className="section-description">
                Connect your broker account to start trading. Your credentials are encrypted and stored securely.
              </p>
              <CredentialManager />
            </div>
          )}

          {activeSection === 'profile' && (
            <div className="section">
              <h2 className="section-title">Profile Settings</h2>
              <p className="section-description">
                View and manage your account information.
              </p>
              <UserProfile />
            </div>
          )}

          {activeSection === 'thresholds' && (
            <div className="section">
              <h2 className="section-title">Trading Thresholds</h2>
              <p className="section-description">
                Configure trading indicators and thresholds for your strategy.
              </p>
              <ThresholdIndicators />
            </div>
          )}

          {activeSection === 'safety' && (
            <div className="section">
              <h2 className="section-title">Safety & Risk Management</h2>
              <p className="section-description">
                Set up safety limits to protect your capital.
              </p>
              <SafetySettings />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
