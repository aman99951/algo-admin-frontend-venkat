/**
 * Utility Functions
 */

// Crash-proof primitives
export const toSafeString = (value, fallback = '') => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
};

export const safeLower = (value, fallback = '') => {
  return toSafeString(value, fallback).toLowerCase();
};

export const safeUpper = (value, fallback = '') => {
  return toSafeString(value, fallback).toUpperCase();
};

export const safeNumber = (value, fallback = 0) => {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const safeFixed = (value, digits = 2, fallback = '—') => {
  const num = safeNumber(value, NaN);
  return Number.isFinite(num) ? num.toFixed(digits) : fallback;
};

// Format currency
export const formatCurrency = (value, currency = '₹') => {
  if (value === null || value === undefined) return 'N/A';
  return `${currency}${Number(value).toFixed(2)}`;
};

// Format percentage
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return 'N/A';
  return `${Number(value).toFixed(2)}%`;
};

// Format date/time
export const formatDateTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A';
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// Color based on value
export const getColorByValue = (value) => {
  if (value > 0) return 'var(--accent-green)';
  if (value < 0) return 'var(--accent-red)';
  return 'var(--text-secondary)';
};

// Calculate P&L percentage
export const calculatePnLPercentage = (entry, exit) => {
  if (!entry || entry === 0) return 0;
  return ((exit - entry) / entry) * 100;
};

// Truncate text
export const truncate = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Generate unique ID
export const generateId = () => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Check if market is open (IST time)
export const isMarketOpen = () => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  const day = istTime.getDay();
  const hour = istTime.getHours();
  const minute = istTime.getMinutes();
  
  // Market closed on weekends
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:15 AM - 3:30 PM IST
  const startTime = 9 * 60 + 15; // 9:15 AM in minutes
  const endTime = 15 * 60 + 30; // 3:30 PM in minutes
  const currentTime = hour * 60 + minute;
  
  return currentTime >= startTime && currentTime <= endTime;
};

// Get market status
export const getMarketStatus = () => {
  if (isMarketOpen()) {
    return { status: 'open', message: 'Market is Open' };
  }
  return { status: 'closed', message: 'Market is Closed' };
};

// Calculate time until market opens
export const getTimeUntilMarketOpen = () => {
  const now = new Date();
  const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  // Set to next market open (9:15 AM)
  const nextOpen = new Date(istTime);
  nextOpen.setHours(9, 15, 0, 0);
  
  // If already past 9:15 AM, set to next day
  if (istTime > nextOpen) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  // Skip weekends
  while (nextOpen.getDay() === 0 || nextOpen.getDay() === 6) {
    nextOpen.setDate(nextOpen.getDate() + 1);
  }
  
  const diff = nextOpen - istTime;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  return { hours, minutes };
};

export default {
  toSafeString,
  safeLower,
  safeUpper,
  safeNumber,
  safeFixed,
  formatCurrency,
  formatPercentage,
  formatDateTime,
  formatTime,
  formatDate,
  getColorByValue,
  calculatePnLPercentage,
  truncate,
  debounce,
  throttle,
  generateId,
  isMarketOpen,
  getMarketStatus,
  getTimeUntilMarketOpen,
};
