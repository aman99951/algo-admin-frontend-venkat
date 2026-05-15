/**
 * API Service
 * Central API client for all backend communication
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add session_id
apiClient.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('session_id');
  if (sessionId) {
    config.params = {
      ...config.params,
      session_id: sessionId,
    };
  }

  const sessionSecret = localStorage.getItem('session_secret');
  if (sessionSecret) {
    config.headers = {
      ...config.headers,
      'X-Session-Secret': sessionSecret,
    };
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear session and redirect to login
      localStorage.removeItem('session_id');
      localStorage.removeItem('session_secret');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ Authentication ============
export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },
  
  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    localStorage.removeItem('session_id');
    localStorage.removeItem('session_secret');
    localStorage.removeItem('user_info');
    return response.data;
  },
  
  getSession: async (sessionId) => {
    const response = await apiClient.get(`/auth/session/${sessionId}`);
    return response.data;
  },
  
  getSavedCredentials: async () => {
    const response = await apiClient.get('/auth/users/saved-credentials');
    return response.data;
  },
  
  loadCredentials: async (broker) => {
    const response = await apiClient.post('/auth/users/load-credentials', null, {
      params: { broker },
    });
    return response.data;
  },
  
  getUserProfile: async () => {
    const response = await apiClient.get('/auth/users/me');
    return response.data;
  },
  
  updateUserProfile: async (profileData) => {
    const response = await apiClient.put('/auth/users/me', profileData);
    return response.data;
  },
  
  deleteCredentials: async (broker) => {
    const response = await apiClient.delete(`/auth/users/credentials/${broker}`);
    return response.data;
  },
};

// ============ Broker API ============
export const brokerAPI = {
  getLTP: async (symbols) => {
    const response = await apiClient.get('/broker/ltp', {
      params: { symbols: symbols.join(',') },
    });
    return response.data;
  },
  
  getHistoricalData: async (symbol, exchange, fromDate, toDate, interval = 'minute') => {
    const response = await apiClient.get('/broker/historical', {
      params: { symbol, exchange, from_date: fromDate, to_date: toDate, interval },
    });
    return response.data;
  },
  
  getPositions: async () => {
    const response = await apiClient.get('/broker/positions');
    return response.data;
  },
  
  getOrders: async () => {
    const response = await apiClient.get('/broker/orders');
    return response.data;
  },
  
  placeOrder: async (orderData) => {
    const response = await apiClient.post('/broker/order', orderData);
    return response.data;
  },
  
  getMargins: async () => {
    const response = await apiClient.get('/broker/margins');
    return response.data;
  },
  
  getProfile: async () => {
    const response = await apiClient.get('/broker/profile');
    return response.data;
  },
};

// ============ MAB (Transparency) ============
export const mabAPI = {
  getState: async (index = null) => {
    const response = await apiClient.get('/mab/state', {
      params: index ? { index } : undefined,
    });
    return response.data;
  },
};

// ============ Trading ============
export const tradingAPI = {
  initialize: async (indices, paperMode = true, confirmLive = false) => {
    const response = await apiClient.post(
      '/trading/initialize',
      {
        indices,
        paper_mode: paperMode,
        confirm_live: confirmLive,
      },
      {
        // Dual-channel transmission: send confirm_live in both body and query params
        // This ensures the flag survives proxy stripping or middleware issues
        params: confirmLive ? { confirm_live: true } : {},
      }
    );
    return response.data;
  },
  
  start: async (indices = null) => {
    const response = await apiClient.post('/trading/start', {
      indices,
    });
    return response.data;
  },
  
  stop: async (indices = null) => {
    const response = await apiClient.post('/trading/stop', {
      indices,
    });
    return response.data;
  },
  
  getStatus: async () => {
    const response = await apiClient.get('/trading/status');
    return response.data;
  },
  
  executeTrade: async (index, signal, force = false) => {
    const response = await apiClient.post('/trading/execute', {
      index,
      signal,
      force,
    });
    return response.data;
  },
  
  getTrades: async () => {
    const response = await apiClient.get('/trading/trades');
    return response.data;
  },
  
  getSafetyStats: async () => {
    const response = await apiClient.get('/trading/safety-stats');
    return response.data;
  },
  
  updateSafetyLimits: async (limits) => {
    const response = await apiClient.post('/trading/update-safety-limits', limits);
    return response.data;
  },
  
  getPositions: async () => {
    const response = await apiClient.get('/trading/positions');
    return response.data;
  },
  
  cleanup: async () => {
    const response = await apiClient.delete('/trading/cleanup');
    return response.data;
  },
  
  testOrders: async (indices) => {
    const response = await apiClient.post('/trading/test-orders', {
      indices,
    });
    return response.data;
  },
};

// ============ Analytics API ============
export const analyticsAPI = {
  getPerformance: async (index = null, period = 'today') => {
    const response = await apiClient.get('/analytics/performance', {
      params: { index, period },
    });
    return response.data;
  },
  
  getPnLChart: async (index = null, period = 'today') => {
    const response = await apiClient.get('/analytics/charts/pnl', {
      params: { index, period },
    });
    return response.data;
  },
  
  getSignalDistribution: async (index = null) => {
    const response = await apiClient.get('/analytics/charts/signals', {
      params: { index },
    });
    return response.data;
  },
  
  getLiveMetrics: async () => {
    const response = await apiClient.get('/analytics/metrics/live');
    return response.data;
  },
  
  getTrades: async (index = null, limit = 100) => {
    const response = await apiClient.get('/analytics/trades', {
      params: { index, limit },
    });
    return response.data;
  },
  
  getDetailedTrades: async (index = null, limit = 100) => {
    const response = await apiClient.get('/analytics/trades/detailed', {
      params: { index, limit },
    });
    return response.data;
  },
  
  getSummary: async () => {
    const response = await apiClient.get('/analytics/summary');
    return response.data;
  },
};

// ============ Credits / Billing ============
export const creditsAPI = {
  getBalance: async () => {
    const response = await apiClient.get('/dashboard/credits/balance');
    return response.data;
  },

  getHistory: async (limit = 50) => {
    const response = await apiClient.get('/dashboard/credits/history', {
      params: { limit },
    });
    return response.data;
  },

  getPackages: async () => {
    const response = await apiClient.get('/dashboard/credits/packages');
    return response.data;
  },

  getConfig: async () => {
    const response = await apiClient.get('/dashboard/credits/config');
    return response.data;
  },

  createOrder: async (packageId) => {
    const response = await apiClient.post('/dashboard/credits/create-order', {
      package_id: packageId,
    });
    return response.data;
  },

  verifyPayment: async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
    const response = await apiClient.post('/dashboard/credits/verify', {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    });
    return response.data;
  },
};

export default apiClient;
