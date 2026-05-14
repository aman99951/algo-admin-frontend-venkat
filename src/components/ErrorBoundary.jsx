import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || 'An unexpected error occurred.';
      return (
        <div style={{ padding: 16, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
          <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
          <div style={{ marginBottom: 12, opacity: 0.8 }}>{message}</div>
          <button onClick={this.handleReload} style={{ padding: '8px 12px', cursor: 'pointer' }} type="button">
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
