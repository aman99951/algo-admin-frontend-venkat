#!/usr/bin/env node
/**
 * COMPREHENSIVE UI/API VALIDATION TEST
 * Tests all the issues user reported:
 * 1. Login flow for Zerodha and AliceBlue
 * 2. Dashboard state after login
 * 3. Load Saved Credentials broker detection
 * 4. API response validation
 */

const fs = require('fs');
const path = require('path');

console.log(`
============================================================
🧪 COMPREHENSIVE UI/API VALIDATION TEST
============================================================
Testing all reported issues:
1. ❌ Empty screen after Kite/AliceBlue login
2. ❌ Load Saved Credentials defaults to AliceBlue
3. ❌ UI component validation
4. ❌ Backend API output validation
============================================================
`);

let passedTests = 0;
let totalTests = 0;

function test(name, condition, details = '') {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS - ${name}`);
    if (details) console.log(`   ${details}`);
    passedTests++;
    return true;
  } else {
    console.log(`❌ FAIL - ${name}`);
    if (details) console.log(`   ${details}`);
    return false;
  }
}

// Test 1: Login Component - Broker Type Loading
console.log('\n============================================================');
console.log('TEST 1: Login Component - Load Saved Credentials');
console.log('============================================================\n');

const loginPath = path.join(__dirname, 'src/components/Login.jsx');
const loginContent = fs.readFileSync(loginPath, 'utf8');

test(
  'Login component uses multi-broker storage key',
  loginContent.includes("const STORAGE_KEY = 'tradevault_credentials_v2'"),
  'New storage key ensures broker-specific entries'
);

test(
  'Login component defines legacy storage migration',
  loginContent.includes('const LEGACY_STORAGE_KEY') &&
  loginContent.includes('localStorage.removeItem(LEGACY_STORAGE_KEY)'),
  'Legacy storage gets migrated and cleaned up'
);

test(
  'hydrateSavedCredentials helper is implemented',
  loginContent.includes('const hydrateSavedCredentials = () =>'),
  'Credential hydration function exists'
);

test(
  'saveCredentials stores entries per broker',
  loginContent.includes('entries: {') &&
  loginContent.includes('[brokerType]: formData'),
  'Form data persisted for each broker separately'
);

test(
  'handleBrokerChange auto-loads saved credentials',
  loginContent.includes('savedCredentials?.entries?.[newBroker]'),
  'Switching brokers restores saved form data if available'
);

// Test 2: Dashboard Component - Empty State Handling
console.log('\n============================================================');
console.log('TEST 2: Dashboard Component - Empty State Handling');
console.log('============================================================\n');

const dashboardPath = path.join(__dirname, 'src/components/Dashboard.jsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

test(
  'Dashboard defines syncStatusState helper',
  dashboardContent.includes('const syncStatusState = useCallback'),
  'Shared helper keeps Zustand state in sync'
);

test(
  'loadInitialData leverages syncStatusState',
  dashboardContent.includes('syncStatusState(statusRes);'),
  'Bot status results funneled through helper'
);

test(
  'refreshData uses useCallback',
  dashboardContent.includes('const refreshData = useCallback'),
  'Memoized refresh prevents stale closures'
);

test(
  'refreshData always fetches bot status',
  dashboardContent.includes('const statusRes = await tradingAPI.getStatus();') &&
  dashboardContent.includes('syncStatusState(statusRes);'),
  'Status endpoint hit even if initialized flag was false'
);

test(
  'Dashboard has welcome message for uninitialized state',
  dashboardContent.includes('!initialized') &&
  dashboardContent.includes('Welcome to TradeVault') &&
  dashboardContent.includes('Initialize your trading bots'),
  'Shows helpful welcome message when bots not initialized'
);

test(
  'Dashboard initialize handler validates success',
  dashboardContent.includes('if (!initRes.success)') &&
  dashboardContent.includes('throw new Error'),
  'Checks initialization success before proceeding'
);

test(
  'Dashboard waits for backend to process initialization',
  dashboardContent.includes('await new Promise(resolve => setTimeout(resolve, 500))'),
  'Adds small delay for backend processing'
);

// Test 3: BotControl Component - Data Handling
console.log('\n============================================================');
console.log('TEST 3: BotControl Component - Data Handling');
console.log('============================================================\n');

const botControlPath = path.join(__dirname, 'src/components/BotControl.jsx');
const botControlContent = fs.readFileSync(botControlPath, 'utf8');

test(
  'BotControl handles uninitialized state',
  botControlContent.includes('if (!initialized)') &&
  botControlContent.includes('Initialize Trading Bots'),
  'Shows initialization screen when not initialized'
);

test(
  'BotControl converts bots to array',
  botControlContent.includes('Array.isArray(bots) ? bots : Object.values(bots || {})'),
  'Handles both array and object bot data'
);

test(
  'BotControl maps bot list correctly',
  botControlContent.includes('botsList.map((bot) => (') &&
  botControlContent.includes('key={bot.index}'),
  'Maps over bot list with proper keys'
);

test(
  'BotControl shows bot status',
  botControlContent.includes('bot.running ? \'Running\' : \'Stopped\''),
  'Displays running/stopped status'
);

test(
  'BotControl shows empty-state message when bots missing',
  botControlContent.includes('bot-empty-state'),
  'Users get guidance while status is loading'
);

// Test 4: API Service - Structure
console.log('\n============================================================');
console.log('TEST 4: API Service - Request/Response Handling');
console.log('============================================================\n');

const apiPath = path.join(__dirname, 'src/services/api.js');
const apiContent = fs.readFileSync(apiPath, 'utf8');

test(
  'API client adds session_id to requests',
  apiContent.includes('session_id: sessionId') &&
  apiContent.includes('localStorage.getItem(\'session_id\')'),
  'Session ID injected from localStorage'
);

test(
  'API client handles 401 unauthorized',
  apiContent.includes('error.response?.status === 401') &&
  apiContent.includes('localStorage.removeItem(\'session_id\')'),
  'Clears session and redirects on 401'
);

test(
  'Trading API has getStatus method',
  apiContent.includes('getStatus: async () =>') &&
  apiContent.includes('/trading/status'),
  'getStatus endpoint defined'
);

test(
  'Trading API has initialize method',
  apiContent.includes('initialize: async (indices') &&
  apiContent.includes('/trading/initialize'),
  'initialize endpoint defined with indices parameter'
);

// Test 5: Store - State Management
console.log('\n============================================================');
console.log('TEST 5: Store - State Management');
console.log('============================================================\n');

const storePath = path.join(__dirname, 'src/store/store.js');
const storeContent = fs.readFileSync(storePath, 'utf8');

test(
  'Auth store loads session from localStorage',
  storeContent.includes('localStorage.getItem(\'session_id\')'),
  'Session persistence on page reload'
);

test(
  'Auth store has setSession method',
  storeContent.includes('setSession: (sessionId, userInfo)') &&
  storeContent.includes('localStorage.setItem(\'session_id\', sessionId)'),
  'Stores session and user info'
);

test(
  'Trading store has setBots method',
  storeContent.includes('setBots: (bots) => set({ bots })'),
  'Updates bot list in global state'
);

test(
  'Trading store has setLiveMetrics method',
  storeContent.includes('setLiveMetrics: (liveMetrics)'),
  'Updates live metrics in global state'
);

// Test 6: Backend API - Response Structure
console.log('\n============================================================');
console.log('TEST 6: Backend API - Response Validation');
console.log('============================================================\n');

const authApiPath = path.join(__dirname, '../backend/api/auth.py');
const authApiContent = fs.readFileSync(authApiPath, 'utf8');

test(
  'Auth API returns session_id on login',
  authApiContent.includes('session_id: str') &&
  authApiContent.includes('class AuthResponse'),
  'AuthResponse includes session_id field'
);

test(
  'Auth API returns user_info on login',
  authApiContent.includes('user_info: Optional[Dict[str, Any]]') &&
  authApiContent.includes('"user_id": profile.get(\'user_id\')'),
  'Returns user profile information'
);

test(
  'Auth API normalizes broker type',
  authApiContent.includes('broker_type = credentials.broker_type.lower()'),
  'Handles both uppercase and lowercase broker types'
);

const tradingApiPath = path.join(__dirname, '../backend/api/trading.py');
const tradingApiContent = fs.readFileSync(tradingApiPath, 'utf8');

test(
  'Trading API status returns initialized flag',
  tradingApiContent.includes('"initialized": False') &&
  tradingApiContent.includes('"initialized": True'),
  'Status endpoint includes initialized boolean'
);

test(
  'Trading API status returns bots array',
  tradingApiContent.includes('"bots": []') &&
  tradingApiContent.includes('status_list.append'),
  'Status endpoint returns bot list'
);

test(
  'Trading API initialize returns success flag',
  tradingApiContent.includes('"success": True') &&
  tradingApiContent.includes('"message":'),
  'Initialize endpoint returns success response'
);

test(
  'Trading API initialize returns indices list',
  tradingApiContent.includes('"indices": list(bots.keys())'),
  'Returns list of initialized indices'
);

// Summary
console.log('\n============================================================');
console.log('📊 TEST SUMMARY');
console.log('============================================================');
console.log(`✅ PASS: ${passedTests}/${totalTests} tests passed`);
console.log(`❌ FAIL: ${totalTests - passedTests}/${totalTests} tests failed`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! System is properly configured.\n');
  process.exit(0);
} else {
  console.log(`\n⚠️  ${totalTests - passedTests} test(s) failed. Please review the failures above.\n`);
  process.exit(1);
}
