/**
 * Test Suite for UserProfile Component
 * Tests profile display, balance refresh, and logout functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserProfile from '../src/components/UserProfile';
import { tradingAPI } from '../src/services/api';

// Mock the API
vi.mock('../src/services/api', () => ({
  tradingAPI: {
    getUserProfile: vi.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

describe('UserProfile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete window.location;
    window.location = { href: '' };
  });

  it('should display loading state initially', () => {
    tradingAPI.getUserProfile.mockImplementation(() => new Promise(() => {}));
    
    render(<UserProfile />);
    
    expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument();
  });

  it('should display user profile after loading', async () => {
    const mockProfile = {
      user_id: 'TEST123',
      profile: {
        name: 'John Doe',
      },
      broker: 'Zerodha',
      live_balance: 125000,
      statistics: {
        total_pnl: 12500,
        win_rate: 0.85,
        total_trades: 45,
      },
    };

    tradingAPI.getUserProfile.mockResolvedValue(mockProfile);

    render(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Zerodha')).toBeInTheDocument();
      expect(screen.getByText('₹1,25,000')).toBeInTheDocument();
      expect(screen.getByText('₹12,500')).toBeInTheDocument();
      expect(screen.getByText('85.0%')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
    });
  });

  it('should handle profile fetch error gracefully', async () => {
    tradingAPI.getUserProfile.mockRejectedValue(new Error('Network error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<UserProfile />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error fetching profile:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('should refresh balance when refresh button is clicked', async () => {
    const mockProfile = {
      user_id: 'TEST123',
      profile: { name: 'John Doe' },
      broker: 'Zerodha',
      live_balance: 125000,
      statistics: { total_pnl: 12500, win_rate: 0.85, total_trades: 45 },
    };

    tradingAPI.getUserProfile.mockResolvedValue(mockProfile);

    render(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText('Refresh balance');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(tradingAPI.getUserProfile).toHaveBeenCalledTimes(2);
    });
  });

  it('should handle logout correctly', async () => {
    const mockProfile = {
      user_id: 'TEST123',
      profile: { name: 'John Doe' },
      broker: 'Zerodha',
      live_balance: 125000,
      statistics: { total_pnl: 0, win_rate: 0, total_trades: 0 },
    };

    tradingAPI.getUserProfile.mockResolvedValue(mockProfile);

    render(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const logoutButton = screen.getByTitle('Logout');
    fireEvent.click(logoutButton);

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('session_id');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_info');
    expect(window.location.href).toBe('/');
  });

  it('should display positive PnL in green', async () => {
    const mockProfile = {
      user_id: 'TEST123',
      profile: { name: 'John Doe' },
      broker: 'Zerodha',
      live_balance: 125000,
      statistics: { total_pnl: 12500, win_rate: 0.85, total_trades: 45 },
    };

    tradingAPI.getUserProfile.mockResolvedValue(mockProfile);

    render(<UserProfile />);

    await waitFor(() => {
      const pnlElement = screen.getByText('₹12,500');
      expect(pnlElement).toHaveClass('positive');
    });
  });

  it('should display negative PnL in red', async () => {
    const mockProfile = {
      user_id: 'TEST123',
      profile: { name: 'John Doe' },
      broker: 'Zerodha',
      live_balance: 125000,
      statistics: { total_pnl: -5500, win_rate: 0.40, total_trades: 45 },
    };

    tradingAPI.getUserProfile.mockResolvedValue(mockProfile);

    render(<UserProfile />);

    await waitFor(() => {
      const pnlElement = screen.getByText('-₹5,500');
      expect(pnlElement).toHaveClass('negative');
    });
  });

  it('should auto-refresh balance every 30 seconds', async () => {
    vi.useFakeTimers();

    const mockProfile = {
      user_id: 'TEST123',
      profile: { name: 'John Doe' },
      broker: 'Zerodha',
      live_balance: 125000,
      statistics: { total_pnl: 12500, win_rate: 0.85, total_trades: 45 },
    };

    tradingAPI.getUserProfile.mockResolvedValue(mockProfile);

    render(<UserProfile />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Initial call
    expect(tradingAPI.getUserProfile).toHaveBeenCalledTimes(1);

    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(tradingAPI.getUserProfile).toHaveBeenCalledTimes(2);
    });

    // Fast-forward another 30 seconds
    vi.advanceTimersByTime(30000);

    await waitFor(() => {
      expect(tradingAPI.getUserProfile).toHaveBeenCalledTimes(3);
    });

    vi.useRealTimers();
  });
});
