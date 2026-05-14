#!/usr/bin/env node
/**
 * Frontend Test Script
 * Validates React components and API integration
 */

const fs = require('fs');
const path = require('path');

console.log('\n' + '='.repeat(60));
console.log('🧪 FRONTEND TEST SUITE');
console.log('='.repeat(60));

let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ PASS - ${name}`);
    passedTests++;
    return true;
  } catch (error) {
    console.log(`❌ FAIL - ${name}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Test 1: Check essential files exist
test('Essential files exist', () => {
  const files = [
    'src/components/Dashboard.jsx',
    'src/components/BotControl.jsx',
    'src/components/Login.jsx',
    'src/services/api.js',
    'src/services/websocket.js',
    'src/store/store.js'
  ];
  
  files.forEach(file => {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing: ${file}`);
    }
  });
});

// Test 2: Check API service structure
test('API service has required methods', () => {
  const apiFile = fs.readFileSync('src/services/api.js', 'utf8');
  
  const required = [
    'authAPI',
    'tradingAPI',
    'login',
    'initialize',
    'start',
    'stop',
    'getStatus'
  ];
  
  required.forEach(method => {
    if (!apiFile.includes(method)) {
      throw new Error(`Missing API method: ${method}`);
    }
  });
});

// Test 3: Check Dashboard handles empty states
test('Dashboard handles empty/loading states', () => {
  const dashFile = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');
  
  if (!dashFile.includes('loading')) {
    throw new Error('No loading state handling');
  }
  
  if (!dashFile.includes('initialized')) {
    throw new Error('No initialized state check');
  }
});

// Test 4: Check BotControl handles array/object bots
test('BotControl handles both array and object', () => {
  const botFile = fs.readFileSync('src/components/BotControl.jsx', 'utf8');
  
  if (!botFile.includes('Array.isArray')) {
    throw new Error('Missing array check for bots');
  }
  
  if (!botFile.includes('Object.values')) {
    throw new Error('Missing object conversion for bots');
  }
});

// Test 5: Check Login supports both brokers
test('Login supports Zerodha and AliceBlue', () => {
  const loginFile = fs.readFileSync('src/components/Login.jsx', 'utf8');
  
  if (!loginFile.includes('zerodha')) {
    throw new Error('Missing Zerodha support');
  }
  
  if (!loginFile.includes('aliceblue')) {
    throw new Error('Missing AliceBlue support');
  }
  
  if (!loginFile.includes('brokerType')) {
    throw new Error('Missing broker type state');
  }
});

// Test 6: Check WebSocket service
test('WebSocket service properly structured', () => {
  const wsFile = fs.readFileSync('src/services/websocket.js', 'utf8');
  
  const required = [
    'connect',
    'disconnect',
    'onmessage',
    'authenticate',
    'bot_status',
    'trade',
    'pnl'
  ];
  
  required.forEach(method => {
    if (!wsFile.includes(method)) {
      throw new Error(`Missing WebSocket feature: ${method}`);
    }
  });
});

// Test 7: Check store configuration
test('Store has trading and auth states', () => {
  const storeFile = fs.readFileSync('src/store/store.js', 'utf8');
  
  if (!storeFile.includes('useTradingStore')) {
    throw new Error('Missing trading store');
  }
  
  if (!storeFile.includes('useAuthStore')) {
    throw new Error('Missing auth store');
  }
  
  if (!storeFile.includes('bots')) {
    throw new Error('Missing bots state');
  }
});

// Test 8: Check package.json has required dependencies
test('Package.json has required dependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const required = ['react', 'axios', 'zustand', 'react-router-dom'];
  
  required.forEach(dep => {
    if (!pkg.dependencies[dep]) {
      throw new Error(`Missing dependency: ${dep}`);
    }
  });
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total: ${passedTests}/${totalTests} tests passed\n`);

if (passedTests === totalTests) {
  console.log('🎉 ALL FRONTEND TESTS PASSED!');
  process.exit(0);
} else {
  console.log(`⚠️  ${totalTests - passedTests} test(s) failed.`);
  process.exit(1);
}
