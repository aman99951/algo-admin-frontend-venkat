import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { Save, Trash2, RefreshCw, Eye, EyeOff, Lock, Key, User } from 'lucide-react';
import { safeLower } from '../utils/helpers';
import './CredentialManager.css';

function CredentialManager() {
  const [savedCredentials, setSavedCredentials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state for new credentials
  const [broker, setBroker] = useState('zerodha');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [userId, setUserId] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await authAPI.getSavedCredentials();
      // Backend returns a plain array (List[SavedCredential]), not {credentials: [...]}
      setSavedCredentials(Array.isArray(response) ? response : (response.credentials || []));
    } catch (err) {
      console.error('Failed to load credentials:', err);
      setError(err.response?.data?.detail || 'Failed to load saved credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCredentials = async (e) => {
    e.preventDefault();
    
    if (!apiKey.trim() || !apiSecret.trim()) {
      setError('API Key and Secret are required');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      // Use the login endpoint which now saves to PostgreSQL
      const credentials = {
        broker,
        user_id: userId.trim() || undefined,
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        save_credentials: true, // Flag to save to database
      };

      await authAPI.login(credentials);
      
      setSuccess(`✅ ${broker.toUpperCase()} credentials saved successfully!`);
      
      // Clear form
      setApiKey('');
      setApiSecret('');
      setUserId('');
      
      // Reload saved credentials
      setTimeout(() => {
        loadSavedCredentials();
        setSuccess('');
      }, 2000);
      
    } catch (err) {
      console.error('Save credentials error:', err);
      setError(err.response?.data?.detail || 'Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleLoadCredentials = async (brokerName) => {
    if (!brokerName) {
      setError('Invalid broker name');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      await authAPI.loadCredentials(brokerName);
      setSuccess(`✅ Loaded ${brokerName.toUpperCase()} credentials successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Load credentials error:', err);
      setError(err.response?.data?.detail || 'Failed to load credentials');
    }
  };

  const handleDeleteCredentials = async (brokerName) => {
    if (!brokerName) {
      setError('Invalid broker name');
      return;
    }
    
    if (!confirm(`Delete saved ${brokerName.toUpperCase()} credentials?`)) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await authAPI.deleteCredentials(brokerName);
      setSuccess(`✅ Deleted ${brokerName.toUpperCase()} credentials`);
      loadSavedCredentials();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Delete credentials error:', err);
      setError(err.response?.data?.detail || 'Failed to delete credentials');
    }
  };

  const getBrokerIcon = (brokerName) => {
    const icons = {
      zerodha: '🟢',
      aliceblue: '🔵',
      default: '🔐'
    };
    if (!brokerName) return icons.default;
    return icons[safeLower(brokerName)] || icons.default;
  };

  return (
    <div className="credential-manager">
      <div className="credential-manager-header">
        <h2>
          <Lock size={24} />
          Credential Manager
        </h2>
        <p>Securely save and manage your broker credentials (encrypted in PostgreSQL)</p>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
          <button onClick={() => setError('')}>✕</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      <div className="credential-sections">
        {/* Saved Credentials Section */}
        <div className="saved-credentials-section">
          <div className="section-header">
            <h3>Saved Credentials</h3>
            <button 
              className="btn-icon" 
              onClick={loadSavedCredentials}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <RefreshCw className="spinning" size={32} />
              <p>Loading saved credentials...</p>
            </div>
          ) : savedCredentials.length === 0 ? (
            <div className="empty-state">
              <Lock size={48} />
              <p>No saved credentials yet</p>
              <small>Save your broker credentials below to persist them across sessions</small>
            </div>
          ) : (
            <div className="credentials-list">
              {savedCredentials.map((cred) => (
                <div key={cred.broker} className="credential-card">
                  <div className="credential-info">
                    <div className="credential-broker">
                      <span className="broker-icon">{getBrokerIcon(cred.broker)}</span>
                      <span className="broker-name">{cred.broker ? cred.broker.toUpperCase() : 'UNKNOWN'}</span>
                    </div>
                    <div className="credential-meta">
                      <span className="meta-item">
                        <User size={14} />
                        {cred.user_id || 'N/A'}
                      </span>
                      <span className="meta-item">
                        <Key size={14} />
                        Saved {new Date(cred.saved_at).toLocaleDateString()}
                      </span>
                      {cred.last_used && (
                        <span className="meta-item">
                          Last used: {new Date(cred.last_used).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="credential-actions">
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => handleLoadCredentials(cred.broker)}
                      title="Load and use these credentials"
                    >
                      <RefreshCw size={16} />
                      Load
                    </button>
                    <button
                      className="btn-danger btn-sm"
                      onClick={() => handleDeleteCredentials(cred.broker)}
                      title="Delete saved credentials"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Credentials Section */}
        <div className="add-credentials-section">
          <div className="section-header">
            <h3>Save New Credentials</h3>
          </div>

          <form onSubmit={handleSaveCredentials} className="credential-form">
            <div className="form-group">
              <label htmlFor="broker">Broker</label>
              <select
                id="broker"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                required
              >
                <option value="zerodha">Zerodha</option>
                <option value="aliceblue">AliceBlue</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="userId">User ID (Optional)</label>
              <input
                id="userId"
                type="text"
                placeholder="e.g., ABC123"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              />
              <small>Optional: Your broker user ID for reference</small>
            </div>

            <div className="form-group">
              <label htmlFor="apiKey">API Key *</label>
              <input
                id="apiKey"
                type="text"
                placeholder="Enter API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="apiSecret">API Secret *</label>
              <div className="input-with-icon">
                <input
                  id="apiSecret"
                  type={showSecret ? 'text' : 'password'}
                  placeholder="Enter API Secret"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onClick={() => setShowSecret(!showSecret)}
                  title={showSecret ? 'Hide' : 'Show'}
                >
                  {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <small>Encrypted with AES-256 before saving to database</small>
            </div>

            <button
              type="submit"
              className="btn-primary btn-block"
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw size={18} className="spinning" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Credentials
                </>
              )}
            </button>
          </form>

          <div className="security-notice">
            <Lock size={16} />
            <div>
              <strong>Security Notice:</strong>
              <p>Credentials are encrypted with Fernet (AES-256) and stored securely in PostgreSQL. They persist across deployments and restarts.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CredentialManager;
