/**
 * Test Cases for PositionsTable Component
 * End-User Critical Path Testing
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PositionsTable from '../src/components/PositionsTable';
import useStore from '../src/store/store';

// Mock the store
vi.mock('../src/store/store');

// Mock fetch
global.fetch = vi.fn();


describe('PositionsTable - End User Critical Tests', () => {
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock store values
    useStore.mockReturnValue({
      sessionId: 'test_session_123',
      sessionSecret: 'test_secret_456'
    });
  });

  
  describe('Auto-Display After Login', () => {
    /**
     * CRITICAL TEST: Positions appear immediately after login
     * 
     * User Story: "When I log in, I expect to see my positions right away
     * without clicking any buttons or waiting for bot initialization"
     */
    
    it('should display positions immediately on component mount', async () => {
      // Arrange: Mock API returns 2 positions
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          positions: [
            {
              tradingsymbol: 'BANKNIFTY24DEC48000CE',
              index_name: 'BANKNIFTY',
              option_type: 'CE',
              strike: 48000,
              quantity_abs: 35,
              average_price: 250.50,
              last_price: 286.30,
              pnl: 1250.75,
              is_bot_managed: true,
              classification: 'Bot Managed',
              gtt_id: '123456'
            },
            {
              tradingsymbol: 'NIFTY24DEC23500PE',
              index_name: 'NIFTY',
              option_type: 'PE',
              strike: 23500,
              quantity_abs: 50,
              average_price: 120.00,
              last_price: 111.00,
              pnl: -450.50,
              is_bot_managed: false,
              classification: 'Manual',
              gtt_id: null
            }
          ],
          summary: {
            total: 2,
            bot_managed: 1,
            manual: 1
          }
        })
      });
      
      // Act: Component mounts (simulating dashboard load after login)
      render(<PositionsTable />);
      
      // Assert: Wait for positions to load
      await waitFor(() => {
        expect(screen.getByText('BANKNIFTY24DEC48000CE')).toBeInTheDocument();
        expect(screen.getByText('NIFTY24DEC23500PE')).toBeInTheDocument();
      });
      
      // Assert: Count shows correct total
      expect(screen.getByText(/2 position\(s\)/i)).toBeInTheDocument();
      expect(screen.getByText(/1 🤖 Bot/i)).toBeInTheDocument();
      expect(screen.getByText(/1 👤 Manual/i)).toBeInTheDocument();
    });
    
    
    it('should show "No positions" message when user has no trades', async () => {
      // Arrange: Empty positions
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          positions: [],
          summary: { total: 0, bot_managed: 0, manual: 0 }
        })
      });
      
      // Act
      render(<PositionsTable />);
      
      // Assert
      await waitFor(() => {
        expect(screen.getByText('No open positions')).toBeInTheDocument();
        expect(screen.getByText(/will appear here after login/i)).toBeInTheDocument();
      });
    });
  });
  
  
  describe('Position Classification Badges', () => {
    /**
     * CRITICAL TEST: User must clearly see which positions bot manages
     * 
     * User Story: "I need to know which positions are managed by bot and
     * which I placed manually, so I don't accidentally interfere"
     */
    
    it('should show "Bot Managed" badge for positions with GTT', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          positions: [
            {
              tradingsymbol: 'BANKNIFTY24DEC48000CE',
              index_name: 'BANKNIFTY',
              option_type: 'CE',
              strike: 48000,
              quantity_abs: 35,
              average_price: 250.50,
              pnl: 1250.75,
              is_bot_managed: true,
              classification: 'Bot Managed',
              gtt_id: '123456'
            }
          ],
          summary: { total: 1, bot_managed: 1, manual: 0 }
        })
      });
      
      // Act
      render(<PositionsTable />);
      
      // Assert
      await waitFor(() => {
        // Check for "Bot Managed" badge
        expect(screen.getByText('Bot Managed')).toBeInTheDocument();
        expect(screen.getByText('Bot Managed')).toHaveClass('bot');
        
        // Check for GTT OCO badge
        expect(screen.getByText('🛡️ GTT OCO')).toBeInTheDocument();
      });
    });
    
    
    it('should show "Manual" badge for positions without GTT', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          positions: [
            {
              tradingsymbol: 'NIFTY24DEC23500PE',
              index_name: 'NIFTY',
              option_type: 'PE',
              strike: 23500,
              quantity_abs: 50,
              average_price: 120.00,
              pnl: -450.50,
              is_bot_managed: false,
              classification: 'Manual',
              gtt_id: null
            }
          ],
          summary: { total: 1, bot_managed: 0, manual: 1 }
        })
      });
      
      // Act
      render(<PositionsTable />);
      
      // Assert
      await waitFor(() => {
        // Check for "Manual" badge
        expect(screen.getByText('Manual')).toBeInTheDocument();
        expect(screen.getByText('Manual')).toHaveClass('manual');
        
        // Check for "No GTT" badge
        expect(screen.getByText('⚠️ None')).toBeInTheDocument();
      });
    });
    
    
    it('should display both bot and manual positions together', async () => {
      // Arrange: Mixed positions
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          positions: [
            {
              tradingsymbol: 'BANKNIFTY24DEC47500CE',
              is_bot_managed: false,
              classification: 'Manual',
              gtt_id: null,
              // ... other fields
            },
            {
              tradingsymbol: 'BANKNIFTY24DEC48000PE',
              is_bot_managed: true,
              classification: 'Bot Managed',
              gtt_id: '789012',
              // ... other fields
            }
          ],
          summary: { total: 2, bot_managed: 1, manual: 1 }
        })
      });
      
      // Act
      render(<PositionsTable />);
      
      // Assert: Both should be visible
      await waitFor(() => {
        expect(screen.getAllByText('Manual')).toHaveLength(1);
        expect(screen.getAllByText('Bot Managed')).toHaveLength(1);
      });
    });
  });
  
  
  describe('Manual Exit Functionality', () => {
    /**
     * CRITICAL TEST: User can exit any position via button click
     * 
     * User Story: "I want an exit button for every position so I can close
     * trades immediately without going to Zerodha app"
     */
    
    it('should show exit button for every position', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          positions: [
            {
              tradingsymbol: 'BANKNIFTY24DEC48000CE',
              is_bot_managed: true,
              // ... other fields
            },
            {
              tradingsymbol: 'NIFTY24DEC23500PE',
              is_bot_managed: false,
              // ... other fields
            }
          ],
          summary: { total: 2, bot_managed: 1, manual: 1 }
        })
      });
      
      // Act
      render(<PositionsTable />);
      
      // Assert: Exit button exists for both positions
      await waitFor(() => {
        const exitButtons = screen.getAllByRole('button', { name: /exit/i });
        expect(exitButtons).toHaveLength(2);
      });
    });
    
    
    it('should confirm before exiting position', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          positions: [
            {
              tradingsymbol: 'BANKNIFTY24DEC48000CE',
              is_bot_managed: true,
              // ... other fields
            }
          ]
        })
      });
      
      // Mock window.confirm
      global.confirm = vi.fn(() => false);
      
      // Act
      render(<PositionsTable />);
      
      await waitFor(() => {
        const exitButton = screen.getByRole('button', { name: /exit/i });
        fireEvent.click(exitButton);
      });
      
      // Assert: Confirmation dialog shown
      expect(global.confirm).toHaveBeenCalledWith(
        expect.stringContaining('EXIT BANKNIFTY24DEC48000CE')
      );
    });
    
    
    it('should successfully exit position when confirmed', async () => {
      // Arrange: Initial positions fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          positions: [
            {
              tradingsymbol: 'BANKNIFTY24DEC48000CE',
              is_bot_managed: true,
              // ... other fields
            }
          ]
        })
      });
      
      // Mock exit API success
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          order_id: 'ORDER123',
          gtt_cancelled: true
        })
      });
      
      // Mock positions refresh after exit (position gone)
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          positions: [],
          summary: { total: 0, bot_managed: 0, manual: 0 }
        })
      });
      
      global.confirm = vi.fn(() => true);
      global.alert = vi.fn();
      
      // Act
      render(<PositionsTable />);
      
      await waitFor(() => {
        const exitButton = screen.getByRole('button', { name: /exit/i });
        fireEvent.click(exitButton);
      });
      
      // Assert: Success alert shown
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(
          expect.stringContaining('ORDER123')
        );
      });
      
      // Assert: Position removed from table
      await waitFor(() => {
        expect(screen.queryByText('BANKNIFTY24DEC48000CE')).not.toBeInTheDocument();
        expect(screen.getByText('No open positions')).toBeInTheDocument();
      });
    });
    
    
    it('should disable exit button while processing', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          positions: [
            {
              tradingsymbol: 'BANKNIFTY24DEC48000CE',
              // ... other fields
            }
          ]
        })
      });
      
      // Mock slow exit API
      global.fetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true, order_id: 'ORDER123' })
        }), 1000))
      );
      
      global.confirm = vi.fn(() => true);
      
      // Act
      render(<PositionsTable />);
      
      await waitFor(() => {
        const exitButton = screen.getByRole('button', { name: /exit/i });
        fireEvent.click(exitButton);
      });
      
      // Assert: Button disabled and shows "Exiting..."
      await waitFor(() => {
        const exitButton = screen.getByRole('button', { name: /exiting/i });
        expect(exitButton).toBeDisabled();
      });
    });
  });
  
  
  describe('Real-Time Updates', () => {
    /**
     * CRITICAL TEST: P&L should update automatically
     * 
     * User Story: "I want to see my P&L update in real-time without
     * refreshing the page"
     */
    
    it('should poll for updates every 2 seconds', async () => {
      // Arrange
      const mockFetch = vi.fn()
        .mockResolvedValue({
          ok: true,
          json: async () => ({
            success: true,
            positions: [],
            summary: { total: 0, bot_managed: 0, manual: 0 }
          })
        });
      
      global.fetch = mockFetch;
      
      // Act
      render(<PositionsTable />);
      
      // Wait 5 seconds and check fetch call count
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Assert: Should be called ~3 times (initial + 2 polls)
      expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
    
    
    it('should update P&L values when positions change', async () => {
      // Arrange: Initial P&L
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            positions: [
              {
                tradingsymbol: 'BANKNIFTY24DEC48000CE',
                pnl: 1000.00,
                last_price: 280.00,
                // ... other fields
              }
            ]
          })
        })
        // Updated P&L after 2 seconds
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            positions: [
              {
                tradingsymbol: 'BANKNIFTY24DEC48000CE',
                pnl: 1500.50,  // Increased
                last_price: 294.30,  // Increased
                // ... other fields
              }
            ]
          })
        });
      
      // Act
      render(<PositionsTable />);
      
      // Assert: Initial values
      await waitFor(() => {
        expect(screen.getByText('₹1000.00')).toBeInTheDocument();
      });
      
      // Wait for poll
      await waitFor(() => {
        expect(screen.getByText('₹1500.50')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
  
  
  describe('Edge Cases', () => {
    /**
     * Test error scenarios and edge cases
     */
    
    it('should handle API errors gracefully', async () => {
      // Arrange: API failure
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Mock console.error to avoid noise in test output
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      render(<PositionsTable />);
      
      // Assert: Component still renders (shows loading or empty state)
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
      
      consoleError.mockRestore();
    });
    
    
    it('should handle positions with missing fields', async () => {
      // Arrange: Position with incomplete data
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          positions: [
            {
              tradingsymbol: 'BANKNIFTY24DEC48000CE',
              // Missing pnl, last_price, etc.
              is_bot_managed: true
            }
          ]
        })
      });
      
      // Act
      render(<PositionsTable />);
      
      // Assert: Should still render without crashing
      await waitFor(() => {
        expect(screen.getByText('BANKNIFTY24DEC48000CE')).toBeInTheDocument();
      });
    });
  });
});


/**
 * Integration Test: Complete User Journey
 * 
 * Tests the full flow from login to position management
 */
describe('Complete Position Management Flow', () => {
  
  it('should handle complete user journey: login -> view -> exit', async () => {
    // Step 1: User logs in (positions auto-fetched)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        positions: [
          {
            tradingsymbol: 'BANKNIFTY24DEC48000CE',
            index_name: 'BANKNIFTY',
            option_type: 'CE',
            strike: 48000,
            quantity_abs: 35,
            average_price: 250.50,
            last_price: 286.30,
            pnl: 1250.75,
            is_bot_managed: true,
            classification: 'Bot Managed',
            gtt_id: '123456'
          }
        ],
        summary: { total: 1, bot_managed: 1, manual: 0 }
      })
    });
    
    // Step 2: Render dashboard
    render(<PositionsTable />);
    
    // Step 3: Verify position visible
    await waitFor(() => {
      expect(screen.getByText('BANKNIFTY24DEC48000CE')).toBeInTheDocument();
      expect(screen.getByText('Bot Managed')).toBeInTheDocument();
      expect(screen.getByText('₹1250.75')).toBeInTheDocument();
    });
    
    // Step 4: Mock exit API
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        order_id: 'ORDER123',
        gtt_cancelled: true
      })
    });
    
    // Step 5: Mock positions refresh (empty)
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        positions: [],
        summary: { total: 0, bot_managed: 0, manual: 0 }
      })
    });
    
    global.confirm = vi.fn(() => true);
    global.alert = vi.fn();
    
    // Step 6: Click exit
    const exitButton = screen.getByRole('button', { name: /exit/i });
    fireEvent.click(exitButton);
    
    // Step 7: Verify exit success
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith(
        expect.stringContaining('successfully')
      );
    });
    
    // Step 8: Verify position removed
    await waitFor(() => {
      expect(screen.getByText('No open positions')).toBeInTheDocument();
    });
  });
});


// Run tests with: npm test -- PositionsTable.test.jsx
