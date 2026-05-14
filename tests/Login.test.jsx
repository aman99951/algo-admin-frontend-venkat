/**
 * Test Suite for Login Component
 * Tests authentication, credential management, and saved credentials loading
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from '../src/components/Login';
import { authAPI } from '../src/services/api';
import { wsService } from '../src/services/websocket';

vi.mock('../src/services/api', () => ({
  authAPI: {
    login: vi.fn(),
    getSavedCredentials: vi.fn(),
    loadCredentials: vi.fn(),
  },
}));

vi.mock('../src/services/websocket', () => ({
  wsService: {
    connect: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial Render', () => {
    it('should render login form', () => {
      renderLogin();

      expect(screen.getByText('TradeVault')).toBeInTheDocument();
      expect(screen.getByText('Professional Trading System')).toBeInTheDocument();
      expect(screen.getByLabelText('Broker Type')).toBeInTheDocument();
    });

    it('should show Zerodha as default broker', () => {
      renderLogin();

      const brokerSelect = screen.getByLabelText('Broker Type');
      expect(brokerSelect.value).toBe('zerodha');
    });

    it('should fetch saved credentials on mount', async () => {
      authAPI.getSavedCredentials.mockResolvedValue([]);
      
      renderLogin();

      await waitFor(() => {
        expect(authAPI.getSavedCredentials).toHaveBeenCalled();
      });
    });
  });

  describe('Zerodha Authentication', () => {
    it('should show Zerodha specific fields', () => {
      renderLogin();

      expect(screen.getByLabelText(/API Key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/API Secret/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Access Token/i)).toBeInTheDocument();
    });

    it('should submit Zerodha credentials successfully', async () => {
      authAPI.login.mockResolvedValue({
        success: true,
        session_id: 'test-session-123',
        user_info: {
          user_id: 'AB1234',
          user_name: 'John Doe',
          broker: 'Zerodha',
          available_cash: 125000,
        },
      });

      wsService.connect.mockResolvedValue(true);

      renderLogin();

      // Fill in form
      fireEvent.change(screen.getByLabelText(/API Key/i), {
        target: { value: 'test_api_key' },
      });
      fireEvent.change(screen.getByLabelText(/Access Token/i), {
        target: { value: 'test_access_token' },
      });

      // Submit
      const submitButton = screen.getByText('Login').closest('button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith(
          expect.objectContaining({
            broker_type: 'zerodha',
            api_key: 'test_api_key',
            access_token: 'test_access_token',
          })
        );
        expect(wsService.connect).toHaveBeenCalledWith('test-session-123');
      });
    });

    it('should handle login error', async () => {
      authAPI.login.mockRejectedValue({
        response: {
          data: {
            detail: 'Invalid credentials',
          },
        },
      });

      renderLogin();

      fireEvent.change(screen.getByLabelText(/API Key/i), {
        target: { value: 'invalid_key' },
      });

      const submitButton = screen.getByText('Login').closest('button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('AliceBlue Authentication', () => {
    it('should show AliceBlue fields when selected', () => {
      renderLogin();

      const brokerSelect = screen.getByLabelText('Broker Type');
      fireEvent.change(brokerSelect, { target: { value: 'aliceblue' } });

      expect(screen.getByLabelText(/User ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/API Secret/i)).toBeInTheDocument();
    });

    it('should submit AliceBlue credentials successfully', async () => {
      authAPI.login.mockResolvedValue({
        success: true,
        session_id: 'test-session-456',
        user_info: {
          user_id: '123456',
          user_name: 'Jane Smith',
          broker: 'AliceBlue',
          available_cash: 100000,
        },
      });

      wsService.connect.mockResolvedValue(true);

      renderLogin();

      // Switch to AliceBlue
      const brokerSelect = screen.getByLabelText('Broker Type');
      fireEvent.change(brokerSelect, { target: { value: 'aliceblue' } });

      // Fill in form
      fireEvent.change(screen.getByLabelText(/User ID/i), {
        target: { value: '123456' },
      });
      fireEvent.change(screen.getByLabelText(/API Secret/i), {
        target: { value: 'test_secret' },
      });

      // Submit
      const submitButton = screen.getByText('Login').closest('button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authAPI.login).toHaveBeenCalledWith(
          expect.objectContaining({
            broker_type: 'aliceblue',
            user_id: '123456',
            api_secret: 'test_secret',
          })
        );
      });
    });
  });

  describe('Saved Credentials', () => {
    it('should display saved credentials button', async () => {
      authAPI.getSavedCredentials.mockResolvedValue([
        {
          broker: 'Zerodha',
          user_id: 'AB1234',
          user_name: 'John Doe',
          last_used: '2025-12-10T10:00:00',
        },
      ]);

      renderLogin();

      await waitFor(() => {
        const loadButton = screen.getByText(/Load Saved \(1\)/i);
        expect(loadButton).toBeInTheDocument();
      });
    });

    it('should show saved credentials menu when clicked', async () => {
      authAPI.getSavedCredentials.mockResolvedValue([
        {
          broker: 'Zerodha',
          user_id: 'AB1234',
          user_name: 'John Doe',
          last_used: '2025-12-10T10:00:00',
        },
      ]);

      renderLogin();

      await waitFor(() => {
        const loadButton = screen.getByText(/Load Saved \(1\)/i);
        fireEvent.click(loadButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Load Saved Credentials')).toBeInTheDocument();
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText(/Zerodha • AB1234/i)).toBeInTheDocument();
      });
    });

    it('should auto-login with saved credentials', async () => {
      authAPI.getSavedCredentials.mockResolvedValue([
        {
          broker: 'Zerodha',
          user_id: 'AB1234',
          user_name: 'John Doe',
          last_used: '2025-12-10T10:00:00',
        },
      ]);

      authAPI.loadCredentials.mockResolvedValue({
        success: true,
        session_id: 'loaded-session-789',
        user_info: {
          user_id: 'AB1234',
          user_name: 'John Doe',
          broker: 'Zerodha',
        },
      });

      wsService.connect.mockResolvedValue(true);

      renderLogin();

      await waitFor(() => {
        const loadButton = screen.getByText(/Load Saved \(1\)/i);
        fireEvent.click(loadButton);
      });

      await waitFor(() => {
        const credentialLoadButton = screen.getAllByText('Load')[0];
        fireEvent.click(credentialLoadButton);
      });

      await waitFor(() => {
        expect(authAPI.loadCredentials).toHaveBeenCalledWith('AB1234', 'Zerodha');
        expect(wsService.connect).toHaveBeenCalledWith('loaded-session-789');
      });
    });

    it('should disable Load Saved button when no credentials', async () => {
      authAPI.getSavedCredentials.mockResolvedValue([]);

      renderLogin();

      await waitFor(() => {
        const loadButton = screen.getByText(/Load Saved \(0\)/i);
        expect(loadButton).toBeDisabled();
      });
    });
  });

  describe('Credential Management', () => {
    it('should have Save button', () => {
      renderLogin();

      expect(screen.getByText(/💾 Save/i)).toBeInTheDocument();
    });

    it('should have Load Local button', () => {
      renderLogin();

      expect(screen.getByText(/📂 Load Local/i)).toBeInTheDocument();
    });

    it('should have Clear button', () => {
      renderLogin();

      expect(screen.getByText(/🗑️ Clear/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require API key for Zerodha', async () => {
      authAPI.login.mockResolvedValue({ success: false });

      renderLogin();

      const submitButton = screen.getByText('Login').closest('button');
      fireEvent.click(submitButton);

      // Form should not submit with empty fields
      await waitFor(() => {
        expect(authAPI.login).not.toHaveBeenCalled();
      });
    });

    it('should show loading state during login', async () => {
      authAPI.login.mockImplementation(() => new Promise(() => {}));

      renderLogin();

      fireEvent.change(screen.getByLabelText(/API Key/i), {
        target: { value: 'test_key' },
      });
      fireEvent.change(screen.getByLabelText(/Access Token/i), {
        target: { value: 'test_token' },
      });

      const submitButton = screen.getByText('Login').closest('button');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Authenticating...')).toBeInTheDocument();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle API Secret visibility', () => {
      renderLogin();

      const secretInput = screen.getByLabelText(/API Secret/i);
      expect(secretInput.type).toBe('password');

      const toggleButton = secretInput
        .closest('.form-group')
        .querySelector('button');
      
      fireEvent.click(toggleButton);
      expect(secretInput.type).toBe('text');

      fireEvent.click(toggleButton);
      expect(secretInput.type).toBe('password');
    });

    it('should toggle Access Token visibility', () => {
      renderLogin();

      const tokenInput = screen.getByLabelText(/Access Token/i);
      expect(tokenInput.type).toBe('password');

      const toggleButton = tokenInput
        .closest('.form-group')
        .querySelector('button');
      
      fireEvent.click(toggleButton);
      expect(tokenInput.type).toBe('text');
    });
  });
});
