import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { creditsAPI } from '../services/api';
import './CreditsBadge.css';

/**
 * Compact credit balance badge.
 * Non-intrusive: fetches silently, hides if credit system is down.
 */
export default function CreditsBadge() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    try {
      const data = await creditsAPI.getBalance();
      setBalance(data);
    } catch {
      // Silently fail — credits should never disrupt the UI
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  if (loading || balance === null) return null;

  const tradesRemaining = balance.trades_remaining ?? Math.floor((balance.balance || 0) / 10);
  const isLow = tradesRemaining <= 10;

  return (
    <button
      className={`credits-badge-compact ${isLow ? 'credits-low' : ''}`}
      onClick={() => navigate('/credits')}
      title={`${balance.balance ?? 0} credits · ${tradesRemaining} trades remaining`}
    >
      <Coins size={14} />
      <span className="credits-count">{tradesRemaining}</span>
      <span className="credits-label">trades</span>
    </button>
  );
}
