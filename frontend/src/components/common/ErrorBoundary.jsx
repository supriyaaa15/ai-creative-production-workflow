import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}>
          <div style={{
            maxWidth: 440,
            width: '100%',
            margin: '0 24px',
            padding: '32px',
            background: 'var(--surface)',
            border: '1px solid var(--danger-bd)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow)',
            textAlign: 'center',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--danger-bg)',
              border: '1px solid var(--danger-bd)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--danger)',
            }}>
              !
            </div>
            <h2 style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 17,
              fontWeight: 600,
              color: 'var(--text-1)',
              marginBottom: 8,
            }}>
              Creative Director couldn't load
            </h2>
            <p style={{
              fontSize: 11,
              fontFamily: 'monospace',
              color: 'var(--danger)',
              background: 'var(--danger-bg)',
              padding: '10px 12px',
              borderRadius: 'var(--radius)',
              marginBottom: 24,
              wordBreak: 'break-all',
              textAlign: 'left',
              lineHeight: 1.5,
            }}>
              {this.state.error?.message || String(this.state.error)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onRetry) this.props.onRetry();
                }}
                className="btn btn-primary btn-sm"
              >
                Retry
              </button>
              {this.props.onBack && (
                <button
                  onClick={this.props.onBack}
                  className="btn btn-secondary btn-sm"
                >
                  Back to brief
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
