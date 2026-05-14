/**
 * Global State Store using Zustand
 */

import { create } from 'zustand';

export const useAuthStore = create((set) => {
  const sessionId = localStorage.getItem('session_id');
  const sessionSecret = localStorage.getItem('session_secret');
  return {
    sessionId: sessionId || null,
    sessionSecret: sessionSecret || null,
    userInfo: null,
    // If session exists in localStorage, consider authenticated until proven otherwise
    isAuthenticated: !!sessionId,
    
    setSession: (sessionId, userInfo, sessionSecret = null) => {
      localStorage.setItem('session_id', sessionId);
      if (sessionSecret) {
        localStorage.setItem('session_secret', sessionSecret);
      }
      set({ sessionId, sessionSecret: sessionSecret || null, userInfo, isAuthenticated: true });
    },

    setUserInfo: (userInfoOrUpdater) =>
      set((state) => ({
        userInfo:
          typeof userInfoOrUpdater === 'function'
            ? userInfoOrUpdater(state.userInfo)
            : userInfoOrUpdater,
      })),

    logout: () => {
      localStorage.removeItem('session_id');
      localStorage.removeItem('session_secret');
      localStorage.removeItem('user_info');
      set({ sessionId: null, sessionSecret: null, userInfo: null, isAuthenticated: false });
    },
    
    clearSession: () => {
      localStorage.removeItem('session_id');
      localStorage.removeItem('session_secret');
      set({ sessionId: null, sessionSecret: null, userInfo: null, isAuthenticated: false });
    },
  };
});

export const useTradingStore = create((set) => ({
  bots: [],
  positions: [],
  trades: [],
  liveMetrics: null,
  mabState: null,
  tradingInitialized: false,
  tradingStatusUpdatedAt: null,
  tradingStatusError: null,
  
  setBots: (botsOrUpdater) =>
    set((state) => ({
      bots: typeof botsOrUpdater === 'function' ? botsOrUpdater(state.bots) : botsOrUpdater,
    })),
  setPositions: (positionsOrUpdater) =>
    set((state) => ({
      positions: typeof positionsOrUpdater === 'function' ? positionsOrUpdater(state.positions) : positionsOrUpdater,
    })),
  setTrades: (tradesOrUpdater) =>
    set((state) => ({
      trades: typeof tradesOrUpdater === 'function' ? tradesOrUpdater(state.trades) : tradesOrUpdater,
    })),
  setLiveMetrics: (liveMetricsOrUpdater) =>
    set((state) => ({
      liveMetrics:
        typeof liveMetricsOrUpdater === 'function'
          ? liveMetricsOrUpdater(state.liveMetrics)
          : liveMetricsOrUpdater,
    })),
  setMabState: (mabStateOrUpdater) =>
    set((state) => ({
      mabState: typeof mabStateOrUpdater === 'function' ? mabStateOrUpdater(state.mabState) : mabStateOrUpdater,
    })),
  setTradingStatus: (partial) =>
    set((state) => ({
      tradingInitialized: partial.tradingInitialized ?? state.tradingInitialized,
      tradingStatusUpdatedAt: partial.tradingStatusUpdatedAt ?? state.tradingStatusUpdatedAt,
      tradingStatusError: partial.tradingStatusError ?? state.tradingStatusError,
    })),
  
  updateBotStatus: (index, status) =>
    set((state) => ({
      bots: state.bots.map((bot) =>
        bot.index === index ? { ...bot, ...status } : bot
      ),
    })),
  
  addTrade: (trade) =>
    set((state) => ({
      trades: [trade, ...state.trades],
    })),
}));

export const useUIStore = create((set) => ({
  theme: 'dark',
  selectedIndex: null,
  selectedPeriod: 'today',
  isConnected: false,
  
  setTheme: (theme) => set({ theme }),
  setSelectedIndex: (selectedIndex) => set({ selectedIndex }),
  setSelectedPeriod: (selectedPeriod) => set({ selectedPeriod }),
  setConnected: (isConnected) => set({ isConnected }),
}));
