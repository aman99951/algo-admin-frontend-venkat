/**
 * Constants and Configuration
 */

export const BROKER_TYPES = {
  ZERODHA: 'zerodha',
  ALICEBLUE: 'aliceblue',
  HYBRID: 'hybrid',
};

export const INDICES = {
  BANKNIFTY: 'BANKNIFTY',
  NIFTY: 'NIFTY',
};

export const POSITIONS = {
  NONE: 'NONE',
  CE: 'CE',
  PE: 'PE',
};

export const SIGNALS = {
  BUY_CE: 'BUY_CE',
  BUY_PE: 'BUY_PE',
  SELL_CE: 'SELL_CE',
  SELL_PE: 'SELL_PE',
  EXIT: 'EXIT',
};

export const TIME_PERIODS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
};

export const TRADE_FILTERS = {
  ALL: 'all',
  WINNERS: 'winners',
  LOSERS: 'losers',
};

export const ORDER_TYPES = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
  SL: 'SL',
  SLM: 'SL-M',
};

export const PRODUCT_TYPES = {
  MIS: 'MIS',
  NRML: 'NRML',
  CNC: 'CNC',
};

export const TRANSACTION_TYPES = {
  BUY: 'BUY',
  SELL: 'SELL',
};

export const WEBSOCKET_EVENTS = {
  CONNECTED: 'connected',
  AUTHENTICATED: 'authenticated',
  BOT_STATUS: 'bot_status',
  TRADE: 'trade',
  PRICE: 'price',
  PNL: 'pnl',
  ALERT: 'alert',
  ERROR: 'error',
  PING: 'ping',
  PONG: 'pong',
};

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  SESSION: '/api/auth/session',
  
  // Broker
  LTP: '/api/broker/ltp',
  POSITIONS: '/api/broker/positions',
  ORDERS: '/api/broker/orders',
  PLACE_ORDER: '/api/broker/order',
  MARGINS: '/api/broker/margins',
  
  // Trading
  INITIALIZE: '/api/trading/initialize',
  START: '/api/trading/start',
  STOP: '/api/trading/stop',
  STATUS: '/api/trading/status',
  TRADES: '/api/trading/trades',
  
  // Analytics
  PERFORMANCE: '/api/analytics/performance',
  PNL_CHART: '/api/analytics/charts/pnl',
  LIVE_METRICS: '/api/analytics/metrics/live',
  SUMMARY: '/api/analytics/summary',
};

export const COLORS = {
  SUCCESS: '#4caf50',
  ERROR: '#f44336',
  WARNING: '#ff9800',
  INFO: '#2196f3',
  PURPLE: '#9c27b0',
};

export const CHART_COLORS = {
  PNL_POSITIVE: '#4caf50',
  PNL_NEGATIVE: '#f44336',
  VOLUME: '#2196f3',
};

export const MARKET_HOURS = {
  OPEN: { hour: 9, minute: 15 },
  CLOSE: { hour: 15, minute: 30 },
};

export const REFRESH_INTERVALS = {
  FAST: 1000,      // 1 second
  MEDIUM: 3000,    // 3 seconds
  SLOW: 5000,      // 5 seconds
  VERY_SLOW: 10000, // 10 seconds
};

export const LOCAL_STORAGE_KEYS = {
  SESSION_ID: 'session_id',
  THEME: 'theme',
  SELECTED_INDEX: 'selected_index',
};

export default {
  BROKER_TYPES,
  INDICES,
  POSITIONS,
  SIGNALS,
  TIME_PERIODS,
  TRADE_FILTERS,
  ORDER_TYPES,
  PRODUCT_TYPES,
  TRANSACTION_TYPES,
  WEBSOCKET_EVENTS,
  API_ENDPOINTS,
  COLORS,
  CHART_COLORS,
  MARKET_HOURS,
  REFRESH_INTERVALS,
  LOCAL_STORAGE_KEYS,
};
