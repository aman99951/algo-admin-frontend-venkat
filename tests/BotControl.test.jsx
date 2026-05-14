/**
 * Test Suite for BotControl Component
 * Tests bot initialization, start/stop, and status display
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BotControl from '../src/components/BotControl';
import { tradingAPI } from '../src/services/api';

vi.mock('../src/services/api', () => ({
  tradingAPI: {
    start: vi.fn(),
    stop: vi.fn(),
    testOrders: vi.fn(),
  },
}));

describe('BotControl Component', () => {
  const mockOnInitialize = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    delete window.location;
    window.location = { reload: vi.fn() };
  });

  describe('Before Initialization', () => {
    it('should display initialization UI when not initialized', () => {
      render(
        <BotControl
          bots={[]}
          initialized={false}
          onInitialize={mockOnInitialize}
        />
      );

      expect(screen.getByText('Initialize Trading Bots')).toBeInTheDocument();
      expect(screen.getByText('Select indices to start trading:')).toBeInTheDocument();
    });

    it('should show all index options', () => {
      render(
        <BotControl
          bots={[]}
          initialized={false}
          onInitialize={mockOnInitialize}
        />
      );

      expect(screen.getByText('BANKNIFTY')).toBeInTheDocument();
      expect(screen.getByText('NIFTY')).toBeInTheDocument();
      expect(screen.getByText('SENSEX')).toBeInTheDocument();
      expect(screen.getByText('BANKEX')).toBeInTheDocument();
    });

    it('should toggle index selection', () => {
      render(
        <BotControl
          bots={[]}
          initialized={false}
          onInitialize={mockOnInitialize}
        />
      );

      const niftyButton = screen.getByText('NIFTY').closest('button');
      
      // Initially selected
      expect(niftyButton).toHaveClass('selected');

      // Click to deselect
      fireEvent.click(niftyButton);
      expect(niftyButton).not.toHaveClass('selected');

      // Click to reselect
      fireEvent.click(niftyButton);
      expect(niftyButton).toHaveClass('selected');
    });

    it('should disable initialize button when no indices selected', () => {
      render(
        <BotControl
          bots={[]}
          initialized={false}
          onInitialize={mockOnInitialize}
        />
      );

      // Deselect all indices
      const indices = ['BANKNIFTY', 'NIFTY', 'SENSEX', 'BANKEX'];
      indices.forEach(index => {
        const button = screen.getByText(index).closest('button');
        fireEvent.click(button);
      });

      const initButton = screen.getByText('Initialize Bots').closest('button');
      expect(initButton).toBeDisabled();
    });

    it('should call onInitialize with selected indices', async () => {
      render(
        <BotControl
          bots={[]}
          initialized={false}
          onInitialize={mockOnInitialize}
        />
      );

      const initButton = screen.getByText('Initialize Bots').closest('button');
      fireEvent.click(initButton);

      await waitFor(() => {
        expect(mockOnInitialize).toHaveBeenCalledWith([
          'BANKNIFTY',
          'NIFTY',
          'SENSEX',
          'BANKEX',
        ]);
      });
    });

    it('should show test order button', () => {
      render(
        <BotControl
          bots={[]}
          initialized={false}
          onInitialize={mockOnInitialize}
        />
      );

      expect(screen.getByText('Test Order Placement')).toBeInTheDocument();
    });

    it('should execute test orders when button clicked', async () => {
      tradingAPI.testOrders.mockResolvedValue({
        message: 'Placed 2/4 test orders',
        results: [
          { index: 'BANKNIFTY', success: true, order_id: '12345' },
          { index: 'NIFTY', success: true, order_id: '67890' },
        ],
      });

      global.alert = vi.fn();

      render(
        <BotControl
          bots={[]}
          initialized={false}
          onInitialize={mockOnInitialize}
        />
      );

      const testButton = screen.getByText('Test Order Placement').closest('button');
      fireEvent.click(testButton);

      await waitFor(() => {
        expect(tradingAPI.testOrders).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('Placed 2/4 test orders')
        );
      });
    });
  });

  describe('After Initialization', () => {
    const mockBots = [
      {
        index: 'BANKNIFTY',
        status: 'running',
        position: 'FLAT',
        trades_today: 3,
        pnl_today: 1250.50,
        live_data: {
          index_price: 48250.75,
          option_symbol: 'BANKNIFTY24DEC48300CE',
          option_price: 125.50,
          decision: 'HOLD',
          reason: 'Monitoring position',
        },
      },
      {
        index: 'NIFTY',
        status: 'stopped',
        position: 'FLAT',
        trades_today: 0,
        pnl_today: 0,
        live_data: {
          index_price: 24150.25,
          option_symbol: null,
          option_price: null,
          decision: 'WAIT',
          reason: 'No signal',
        },
      },
    ];

    it('should display bot cards when initialized', () => {
      render(
        <BotControl
          bots={mockBots}
          initialized={true}
          onInitialize={mockOnInitialize}
        />
      );

      expect(screen.getByText('BANKNIFTY')).toBeInTheDocument();
      expect(screen.getByText('NIFTY')).toBeInTheDocument();
    });

    it('should show bot status indicators', () => {
      render(
        <BotControl
          bots={mockBots}
          initialized={true}
          onInitialize={mockOnInitialize}
        />
      );

      expect(screen.getByText('running')).toBeInTheDocument();
      expect(screen.getByText('stopped')).toBeInTheDocument();
    });

    it('should display live trading data', () => {
      render(
        <BotControl
          bots={mockBots}
          initialized={true}
          onInitialize={mockOnInitialize}
        />
      );

      expect(screen.getByText('₹48,250.75')).toBeInTheDocument();
      expect(screen.getByText('BANKNIFTY24DEC48300CE')).toBeInTheDocument();
      expect(screen.getByText('₹125.50')).toBeInTheDocument();
      expect(screen.getByText('HOLD')).toBeInTheDocument();
    });

    it('should display PnL with correct color coding', () => {
      render(
        <BotControl
          bots={mockBots}
          initialized={true}
          onInitialize={mockOnInitialize}
        />
      );

      const pnlElement = screen.getByText('₹1,250.50');
      expect(pnlElement).toHaveClass('positive');
    });

    it('should handle start bot action', async () => {
      tradingAPI.start.mockResolvedValue({ success: true });

      render(
        <BotControl
          bots={mockBots}
          initialized={true}
          onInitialize={mockOnInitialize}
        />
      );

      // Find start button for NIFTY (which is stopped)
      const startButtons = screen.getAllByTitle('Start');
      fireEvent.click(startButtons[1]); // NIFTY is second bot

      await waitFor(() => {
        expect(tradingAPI.start).toHaveBeenCalledWith(['NIFTY']);
        expect(window.location.reload).toHaveBeenCalled();
      });
    });

    it('should handle stop bot action', async () => {
      tradingAPI.stop.mockResolvedValue({ success: true });

      render(
        <BotControl
          bots={mockBots}
          initialized={true}
          onInitialize={mockOnInitialize}
        />
      );

      // Find stop button for BANKNIFTY (which is running)
      const stopButtons = screen.getAllByTitle('Stop');
      fireEvent.click(stopButtons[0]); // BANKNIFTY is first bot

      await waitFor(() => {
        expect(tradingAPI.stop).toHaveBeenCalledWith(['BANKNIFTY']);
        expect(window.location.reload).toHaveBeenCalled();
      });
    });

    it('should handle empty bots array gracefully', () => {
      render(
        <BotControl
          bots={[]}
          initialized={true}
          onInitialize={mockOnInitialize}
        />
      );

      expect(screen.queryByText('BANKNIFTY')).not.toBeInTheDocument();
    });

    it('should handle missing live_data gracefully', () => {
      const botsWithoutLiveData = [
        {
          index: 'BANKNIFTY',
          status: 'running',
          position: 'FLAT',
          trades_today: 0,
          pnl_today: 0,
        },
      ];

      render(
        <BotControl
          bots={botsWithoutLiveData}
          initialized={true}
          onInitialize={mockOnInitialize}
        />
      );

      expect(screen.getByText('BANKNIFTY')).toBeInTheDocument();
      expect(screen.getByText('running')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle start error gracefully', async () => {
      tradingAPI.start.mockRejectedValue(new Error('Network error'));
      global.alert = vi.fn();

      const mockBots = [
        {
          index: 'NIFTY',
          status: 'stopped',
          position: 'FLAT',
          trades_today: 0,
          pnl_today: 0,
        },
      ];

      render(
        <BotControl
          bots={mockBots}
          initialized={true}
          onInitialize={mockOnInitialize}
        />
      );

      const startButton = screen.getByTitle('Start');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to start trading');
      });
    });

    it('should handle stop error gracefully', async () => {
      tradingAPI.stop.mockRejectedValue(new Error('Network error'));
      global.alert = vi.fn();

      const mockBots = [
        {
          index: 'BANKNIFTY',
          status: 'running',
          position: 'FLAT',
          trades_today: 0,
          pnl_today: 0,
        },
      ];

      render(
        <BotControl
          bots={mockBots}
          initialized={true}
          onInitialize={mockOnInitialize}
        />
      );

      const stopButton = screen.getByTitle('Stop');
      fireEvent.click(stopButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to stop trading');
      });
    });
  });
});
