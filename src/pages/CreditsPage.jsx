import { useState, useEffect, useCallback } from 'react';
import { Coins, CreditCard, History, TrendingUp, TrendingDown, Zap, RefreshCw, Package } from 'lucide-react';
import { creditsAPI } from '../services/api';
import { useAuthStore } from '../store/store';
import UserHeader from '../components/UserHeader';
import './CreditsPage.css';

export default function CreditsPage() {
  const { userInfo } = useAuthStore();
  const [activeTab, setActiveTab] = useState('packages');
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [packages, setPackages] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Credits - TradeVault';
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [balanceData, historyData, packagesData, configData] = await Promise.all([
        creditsAPI.getBalance().catch(() => null),
        creditsAPI.getHistory().catch(() => []),
        creditsAPI.getPackages().catch(() => []),
        creditsAPI.getConfig().catch(() => ({ credits_per_trade: 10, signup_bonus: 1000 })),
      ]);
      setBalance(balanceData);
      setHistory(historyData);
      setPackages(packagesData);
      setConfig(configData);
    } catch {
      setError('Unable to load credit information');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBuyCredits = async (pkg) => {
    if (!config?.razorpay_key_id) {
      setError('Payment gateway not configured. Please contact support.');
      return;
    }

    setPurchasing(pkg.id);
    try {
      const order = await creditsAPI.createOrder(pkg.id);

      const options = {
        key: order.key_id,
        amount: order.amount * 100,
        currency: order.currency || 'INR',
        name: 'TradeVault',
        description: `${order.package_name} — ${order.credits} credits`,
        order_id: order.order_id,
        handler: async (response) => {
          try {
            await creditsAPI.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            fetchData();
          } catch {
            setError('Payment verification failed. Contact support if amount was deducted.');
          }
        },
        prefill: {
          name: userInfo?.profile?.name || '',
          email: userInfo?.profile?.email || '',
        },
        theme: { color: '#6366f1' },
      };

      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => new window.Razorpay(options).open();
        document.body.appendChild(script);
      } else {
        new window.Razorpay(options).open();
      }
    } catch (err) {
      setError(err?.response?.data?.detail || 'Failed to create payment order');
    } finally {
      setPurchasing(null);
    }
  };

  const tradesRemaining = balance?.trades_remaining ?? Math.floor((balance?.balance || 0) / (config?.credits_per_trade || 10));
  const creditsPerTrade = config?.credits_per_trade || 10;

  return (
    <div className="page-container credits-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Credits & Billing</h1>
          <p className="page-subtitle">Manage your trading credits and purchase packages</p>
        </div>
        <div className="page-header-right">
          <button className="btn-icon-sm" onClick={fetchData} title="Refresh">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <UserHeader />
        </div>
      </div>

      {error && (
        <div className="credits-error">
          <span>{error}</span>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      {/* Balance Overview Cards */}
      {balance && (
        <div className="credits-overview">
          <div className="credit-card credit-card-primary">
            <div className="credit-card-icon">
              <Coins size={22} />
            </div>
            <div className="credit-card-info">
              <span className="credit-card-label">Available Balance</span>
              <span className="credit-card-value">{(balance.balance ?? 0).toLocaleString()}</span>
              <span className="credit-card-sub">credits</span>
            </div>
          </div>

          <div className="credit-card">
            <div className="credit-card-icon icon-green">
              <Zap size={22} />
            </div>
            <div className="credit-card-info">
              <span className="credit-card-label">Trades Remaining</span>
              <span className="credit-card-value">{tradesRemaining}</span>
              <span className="credit-card-sub">@ {creditsPerTrade} credits/trade</span>
            </div>
          </div>

          <div className="credit-card">
            <div className="credit-card-icon icon-blue">
              <TrendingUp size={22} />
            </div>
            <div className="credit-card-info">
              <span className="credit-card-label">Total Purchased</span>
              <span className="credit-card-value">{(balance.lifetime_purchased ?? 0).toLocaleString()}</span>
              <span className="credit-card-sub">lifetime</span>
            </div>
          </div>

          <div className="credit-card">
            <div className="credit-card-icon icon-orange">
              <TrendingDown size={22} />
            </div>
            <div className="credit-card-info">
              <span className="credit-card-label">Total Used</span>
              <span className="credit-card-value">{(balance.lifetime_consumed ?? 0).toLocaleString()}</span>
              <span className="credit-card-sub">consumed</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="credits-tabs">
        <button
          className={`credits-tab ${activeTab === 'packages' ? 'active' : ''}`}
          onClick={() => setActiveTab('packages')}
        >
          <Package size={16} />
          Buy Credits
        </button>
        <button
          className={`credits-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={16} />
          Transaction History
        </button>
      </div>

      {/* Buy Credits Tab */}
      {activeTab === 'packages' && (
        <div className="credits-section">
          {packages.length === 0 && !loading && (
            <p className="credits-empty">No packages available at this time.</p>
          )}
          <div className="packages-grid">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`package-card ${pkg.name === 'Pro' ? 'package-popular' : ''}`}
              >
                {pkg.name === 'Pro' && <span className="package-badge">Most Popular</span>}
                <h4 className="package-name">{pkg.name}</h4>
                <div className="package-credits">
                  <span className="package-credits-value">{(pkg.total_credits || pkg.credits || 0).toLocaleString()}</span>
                  <span className="package-credits-label">credits</span>
                </div>
                <div className="package-meta">
                  <span>{Math.floor((pkg.total_credits || pkg.credits || 0) / creditsPerTrade)} trades</span>
                  {pkg.bonus_credits > 0 && (
                    <span className="package-bonus">+{pkg.bonus_credits} bonus</span>
                  )}
                </div>
                <div className="package-price">
                  <span className="package-currency">₹</span>
                  <span className="package-amount">{(pkg.price_inr || pkg.price || 0).toLocaleString()}</span>
                </div>
                <button
                  className="btn-buy"
                  onClick={() => handleBuyCredits(pkg)}
                  disabled={purchasing === pkg.id}
                >
                  <CreditCard size={16} />
                  {purchasing === pkg.id ? 'Processing…' : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History Tab */}
      {activeTab === 'history' && (
        <div className="credits-section">
          {history.length === 0 && !loading && (
            <p className="credits-empty">No transactions yet. Your signup bonus of {config?.signup_bonus || 1000} credits was auto-applied!</p>
          )}
          <div className="history-list">
            {history.map((txn, idx) => (
              <div key={txn.id || idx} className={`history-item ${txn.amount >= 0 ? 'credit' : 'debit'}`}>
                <div className="history-icon">
                  {txn.amount >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <div className="history-details">
                  <span className="history-desc">{txn.description || txn.type || 'Transaction'}</span>
                  <span className="history-date">
                    {txn.created_at ? new Date(txn.created_at).toLocaleString() : ''}
                  </span>
                </div>
                <div className={`history-amount ${txn.amount >= 0 ? 'positive' : 'negative'}`}>
                  {txn.amount >= 0 ? '+' : ''}{txn.amount}
                </div>
                <div className="history-balance">
                  Bal: {txn.balance_after ?? '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="credits-loading">
          <div className="spinner"></div>
          <p>Loading credit information…</p>
        </div>
      )}
    </div>
  );
}
