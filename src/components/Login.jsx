import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Key, Lock, Shield, Save, Trash2, Eye, EyeOff, Download } from 'lucide-react';
import { useAuthStore } from '../store/store';
import { authAPI } from '../services/api';
import { wsService } from '../services/websocket';
import './Login.css';

const STORAGE_KEY = 'tradevault_credentials_v2';
const LEGACY_STORAGE_KEY = 'tradevault_credentials';

const EMPTY_FORM = {
  // Zerodha fields
  kite_id: '',
  api_key: '',
  api_secret: '',
  request_token: '',
  access_token: '',
  // AliceBlue fields
  user_id: '',
  session_id: '',
};

const getBrokerName = (type) => {
  if (type === 'zerodha') return 'Zerodha (Kite)';
  if (type === 'aliceblue') return 'AliceBlue';
  if (type === 'hybrid') return 'Hybrid';
  return 'Broker';
};

const hydrateSavedCredentials = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const safeParse = (value) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      console.error('Failed to parse stored credentials:', error);
      return null;
    }
  };

  const modernRaw = localStorage.getItem(STORAGE_KEY);
  if (modernRaw) {
    const parsed = safeParse(modernRaw);
    if (parsed?.entries) {
      return parsed;
    }
  }

  const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (legacyRaw) {
    const legacyParsed = safeParse(legacyRaw);
    if (legacyParsed) {
      const converted = {
        lastUsed: legacyParsed.brokerType || 'zerodha',
        entries: {
          [legacyParsed.brokerType || 'zerodha']: legacyParsed.formData || {},
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(converted));
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return converted;
    }
  }

  return null;
};

function Login() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  
  const [savedCredentials, setSavedCredentials] = useState(() => hydrateSavedCredentials());
  const initialBroker = savedCredentials?.lastUsed || 'zerodha';
  const [brokerType, setBrokerType] = useState(initialBroker);
  const [formData, setFormData] = useState(() => ({
    ...EMPTY_FORM,
    ...(savedCredentials?.entries?.[initialBroker] || {}),
  }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [availableCredentials, setAvailableCredentials] = useState([]);

  // Fetch saved credentials from backend on mount
  useEffect(() => {
    fetchAvailableCredentials();
  }, []);

  const fetchAvailableCredentials = async () => {
    try {
      const creds = await authAPI.getSavedCredentials();
      setAvailableCredentials(creds || []);
    } catch (error) {
      console.error('Failed to fetch saved credentials:', error);
      setAvailableCredentials([]);
    }
  };

  const handleLoadSavedCredential = async (credential) => {
    setLoading(true);
    setError('');
    setShowLoadMenu(false);

    try {
      const response = await authAPI.loadCredentials(credential.broker);

      if (response.success) {
        setSession(response.session_id, response.user_info, response.session_secret);
        
        // Try to connect WebSocket, but don't block navigation if it fails
        try {
          await wsService.connect(response.session_id);
          console.log('✅ WebSocket connected successfully');
        } catch (wsError) {
          console.warn('⚠️ WebSocket connection failed, but proceeding to trading:', wsError);
        }

        navigate('/trading', { replace: true });
      } else {
        setError(response.message || 'Failed to load credentials');
      }
    } catch (err) {
      console.error('Load credentials error:', err);
      setError(err.response?.data?.detail || 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  const loadCredentials = (targetBroker = brokerType) => {
    if (!savedCredentials?.entries) {
      setSaveMessage('ℹ️ No saved credentials found yet');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    const entry = savedCredentials.entries[targetBroker];
    if (!entry) {
      setSaveMessage(`ℹ️ No saved ${getBrokerName(targetBroker)} credentials yet`);
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }

    setBrokerType(targetBroker);
    setFormData({
      ...EMPTY_FORM,
      ...entry,
    });
    setSaveMessage(`✅ ${getBrokerName(targetBroker)} credentials loaded successfully`);
    setTimeout(() => setSaveMessage(''), 4000);
  };

  const saveCredentials = () => {
    try {
      const brokerName = getBrokerName(brokerType);
      const nextSaved = {
        lastUsed: brokerType,
        entries: {
          ...(savedCredentials?.entries || {}),
          [brokerType]: formData,
        },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSaved));
      setSavedCredentials(nextSaved);
      setSaveMessage(`✅ ${brokerName} credentials saved successfully`);
      setTimeout(() => setSaveMessage(''), 4000);
    } catch (e) {
      console.error('Failed to save credentials:', e);
      setSaveMessage('❌ Failed to save credentials');
      setTimeout(() => setSaveMessage(''), 3000);
    }
  };

  const clearCredentials = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setSavedCredentials(null);
    setFormData({ ...EMPTY_FORM });
    setSaveMessage('🗑️ Credentials cleared');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user types
    if (error) setError('');
  };

  const handleBrokerChange = (newBroker) => {
    setBrokerType(newBroker);
    if (savedCredentials?.entries?.[newBroker]) {
      setFormData({
        ...EMPTY_FORM,
        ...savedCredentials.entries[newBroker],
      });
      setSaveMessage(`ℹ️ Loaded saved ${getBrokerName(newBroker)} credentials`);
      setTimeout(() => setSaveMessage(''), 3000);
    } else {
      setFormData({ ...EMPTY_FORM });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const credentials = {
        broker_type: brokerType,
        save_credentials: true,  // Always save credentials
        user_name: formData.user_name || formData.user_id || formData.kite_id,
        email: formData.email
      };

      // Add broker-specific fields
      if (brokerType === 'zerodha') {
        const apiKey = formData.api_key?.trim();
        const apiSecret = formData.api_secret?.trim();
        const requestToken = formData.request_token?.trim();
        const accessToken = formData.access_token?.trim();

        // Require either (api_key + access_token) OR (api_key + request_token + api_secret)
        if (accessToken && apiKey) {
          credentials.api_key = apiKey;
          credentials.access_token = accessToken;
        } else if (requestToken && apiSecret && apiKey) {
          credentials.api_key = apiKey;
          credentials.request_token = requestToken;
          credentials.api_secret = apiSecret;
        } else {
          throw new Error('Please provide either (API Key + Access Token) OR (API Key + Request Token + API Secret)');
        }
      } else if (brokerType === 'aliceblue') {
        credentials.user_id = formData.user_id;
        credentials.api_secret = formData.api_secret;
      }

      const response = await authAPI.login(credentials);

      if (response.success) {
        // Store session
        setSession(response.session_id, response.user_info, response.session_secret);
        
        // Try to connect WebSocket, but don't block navigation if it fails
        try {
          await wsService.connect(response.session_id);
          console.log('✅ WebSocket connected successfully');
        } catch (wsError) {
          console.warn('⚠️ WebSocket connection failed, but proceeding to trading:', wsError);
          // WebSocket can reconnect later, don't block the user
        }

        // Navigate to trading (replace history to prevent back button)
        navigate('/trading', { replace: true });
      } else {
        setError(response.message || 'Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const kiteLoginUrl = formData.api_key?.trim()
    ? `https://kite.zerodha.com/connect/login?api_key=${encodeURIComponent(formData.api_key.trim())}&v=3`
    : '';

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>TradeVault</h1>
          <p>Professional Trading System</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="label">Broker Type</label>
            <select
              className="input"
              value={brokerType}
              onChange={(e) => handleBrokerChange(e.target.value)}
            >
              <option value="zerodha">Zerodha (Kite)</option>
              <option value="aliceblue">AliceBlue</option>
            </select>
          </div>

          {/* Save/Load Controls */}
          <div className="credentials-controls">
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={saveCredentials}
            >
              💾 Save
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={loadCredentials}
            >
              📂 Load Local
            </button>
            <button
              type="button"
              className="btn btn-accent btn-small"
              onClick={() => setShowLoadMenu(!showLoadMenu)}
              disabled={availableCredentials.length === 0}
            >
              <Download size={14} /> Load Saved ({availableCredentials.length})
            </button>
            <button
              type="button"
              className="btn btn-danger btn-small"
              onClick={clearCredentials}
            >
              🗑️ Clear
            </button>
          </div>

          {/* Load Saved Credentials Menu */}
          {showLoadMenu && availableCredentials.length > 0 && (
            <div className="saved-credentials-menu">
              <div className="menu-header">
                <h4>Load Saved Credentials</h4>
                <button 
                  type="button" 
                  onClick={() => setShowLoadMenu(false)}
                  className="close-btn"
                >
                  ✕
                </button>
              </div>
              <div className="credentials-list">
                {availableCredentials.map((cred, idx) => (
                  <div key={idx} className="credential-item">
                    <div className="credential-info">
                      <div className="credential-name">{cred.user_name}</div>
                      <div className="credential-details">
                        {cred.broker} • {cred.user_id}
                      </div>
                      <div className="credential-dates">
                        Last used: {new Date(cred.last_used).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => handleLoadSavedCredential(cred)}
                      disabled={loading}
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {saveMessage && (
            <div className="save-message">
              {saveMessage}
            </div>
          )}

          {/* Zerodha Fields */}
          {brokerType === 'zerodha' && (
            <>
              <div className="form-group">
                <label className="label">Kite ID</label>
                <input
                  type="text"
                  name="kite_id"
                  className="input"
                  placeholder="Enter Kite ID (e.g., AB1234)"
                  value={formData.kite_id}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">API Key <span style={{color: '#ff6b6b'}}>*</span></label>
                <input
                  type="text"
                  name="api_key"
                  className="input"
                  placeholder="Enter your Zerodha API Key"
                  value={formData.api_key}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">API Secret <span style={{color: '#888'}}>(Required for Request Token flow)</span></label>
                <input
                  type={showSecret ? 'text' : 'password'}
                  name="api_secret"
                  className="input"
                  placeholder="Enter your Zerodha API Secret"
                  value={formData.api_secret}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="btn-toggle-secret"
                  onClick={() => setShowSecret(!showSecret)}
                >
                  {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="form-group">
                <label className="label">Request Token <span style={{color: '#888'}}>(Option 1: For new tokens)</span></label>
                <input
                  type="text"
                  name="request_token"
                  className="input"
                  placeholder="Paste request_token from Kite redirect URL"
                  value={formData.request_token}
                  onChange={handleChange}
                />
                {kiteLoginUrl && (
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ marginTop: '8px', width: '100%' }}
                    onClick={() => {
                      const loginUrl = kiteLoginUrl;
                      window.open(loginUrl, '_blank', 'width=800,height=600');
                    }}
                  >
                    🔐 Open Kite Login to Get Request Token
                  </button>
                )}
              </div>

              <div className="form-group">
                <label className="label">Access Token <span style={{color: '#888'}}>(Option 2: If you have existing token)</span></label>
                <input
                  type={showToken ? 'text' : 'password'}
                  name="access_token"
                  className="input"
                  placeholder="Paste your existing Access Token"
                  value={formData.access_token}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  className="btn-toggle-secret"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <div className="help-section">
                <h4>📖 Quick Setup Guide:</h4>
                <ol>
                  <li>
                    <strong>Get API Credentials:</strong> Visit{' '}
                    <a href="https://developers.kite.trade" target="_blank" rel="noopener noreferrer">
                      Kite Connect
                    </a>{' '}
                    and create an app to get your <strong>API Key</strong> and <strong>API Secret</strong>
                  </li>
                  <li>
                    <strong>Get Request Token:</strong> Click the "Open Kite Login" button above, authorize the app, and copy the <code>request_token</code> from the redirect URL
                  </li>
                  <li>
                    <strong>Login:</strong> Paste your API Key, API Secret, and Request Token, then click Login
                  </li>
                  <li>
                    <strong>Your Kite ID</strong> is your Zerodha client code (e.g., AB1234)
                  </li>
                </ol>
                <p className="help-note">
                  ⚠️ <strong>Access token expires daily at 6:00 AM IST.</strong> If you get "Access token expired" error, click the "Generate New Access Token" button above.
                </p>
                <p className="help-note" style={{ marginTop: '8px', borderColor: 'var(--accent-green)' }}>
                  ✅ <strong>Quick Steps (Easiest Method):</strong><br/>
                  1. Enter your API Key and API Secret above<br/>
                  2. Click "Generate Request Token" button<br/>
                  3. Login to Kite in the popup window<br/>
                  4. Copy the <code>request_token</code> from the redirected URL<br/>
                  5. Paste it in the "Request Token" field<br/>
                  6. Click "Login" - The app will auto-generate access token!
                </p>
                <p className="help-note" style={{ marginTop: '8px', borderColor: 'var(--accent-blue)' }}>
                  🔄 <strong>Already have Access Token?</strong><br/>
                  Skip request_token and directly paste your access_token in the "Access Token" field
                </p>
                <p className="help-note" style={{ marginTop: '8px', borderColor: 'var(--accent-blue)' }}>
                  💡 <strong>Need Help?</strong>{' '}
                  <a 
                    href="https://kite.trade/docs/connect/v3/user/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Kite Connect Documentation
                  </a>
                </p>
              </div>
            </>
          )}

          {/* AliceBlue Fields */}
          {brokerType === 'aliceblue' && (
            <>
              <div className="form-group">
                <label className="label">User ID</label>
                <input
                  type="text"
                  name="user_id"
                  className="input"
                  placeholder="Enter User ID"
                  value={formData.user_id}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">API Secret</label>
                <input
                  type="password"
                  name="api_secret"
                  className="input"
                  placeholder="Enter API Secret"
                  value={formData.api_secret}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="help-section">
                <h4>📖 How to get AliceBlue credentials:</h4>
                <ol>
                  <li>Login to <a href="https://ant.aliceblueonline.com" target="_blank" rel="noopener noreferrer">AliceBlue ANT</a></li>
                  <li>Go to <strong>API</strong> section in your account</li>
                  <li>Generate or retrieve your <strong>API Secret Key</strong></li>
                  <li>Your <strong>User ID</strong> is your AliceBlue client ID</li>
                  <li>Make sure API trading is enabled in your account</li>
                </ol>
                <p className="help-note">⚠️ Keep your API Secret secure and never share it</p>
              </div>
            </>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Connecting...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>🔒 Your credentials are stored locally on this device and never sent to our servers.</p>
          <p style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-tertiary)' }}>
            Use Save/Load buttons to manage your credentials securely
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
