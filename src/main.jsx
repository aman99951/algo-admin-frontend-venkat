import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/global.css'

console.log('[main.jsx] Starting React app...');

// Support shareable dashboard links: /?session_id=...
try {
  const params = new URLSearchParams(window.location.search);
  const sharedSessionId = params.get('session_id');
  if (sharedSessionId) {
    localStorage.setItem('session_id', sharedSessionId);
    // Do NOT set session_secret from URL (owner-only)
  }
} catch (e) {
  console.warn('[main.jsx] Failed to read session_id from URL:', e);
}

try {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )
  console.log('[main.jsx] React app rendered successfully');
} catch (error) {
  console.error('[main.jsx] Failed to render React app:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: monospace; color: red;">
      <h1>Error Loading Application</h1>
      <pre>${error.message}\n\n${error.stack}</pre>
    </div>
  `;
}
