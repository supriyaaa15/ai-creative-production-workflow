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
        <div className="max-w-2xl mx-auto my-12 p-8 rounded-xl bg-[#181a20] border border-[var(--loupe-red)] text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-[var(--loupe-red)] flex items-center justify-center mx-auto mb-4 text-[var(--loupe-red)] font-bold text-lg">
            !
          </div>
          <h2 className="font-display text-xl font-bold text-[var(--paper)] mb-2">
            Creative Director couldn't load
          </h2>
          <p className="text-xs text-[var(--loupe-red)] bg-red-950/30 p-3 rounded font-mono mb-6 text-left break-words">
            {this.state.error?.message || String(this.state.error)}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onRetry) this.props.onRetry();
              }}
              className="text-xs px-4 py-2.5 rounded bg-[var(--cobalt)] text-white font-display font-bold uppercase tracking-wider hover:opacity-90 transition-all"
            >
              Retry AI Creative Director
            </button>
            {this.props.onBack && (
              <button
                onClick={this.props.onBack}
                className="text-xs px-4 py-2.5 rounded bg-[#2a2c33] text-[var(--paper)] font-display font-bold uppercase tracking-wider hover:opacity-90 transition-all"
              >
                Back to brief
              </button>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
