import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught unhandled render error:', error, errorInfo);
  }

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleGoToDashboard = (): void => {
    if (typeof window !== 'undefined') {
      window.location.assign('/dashboard');
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="w-full max-w-2xl mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <div
            data-testid="error-boundary-card"
            className="w-full p-6 sm:p-8 rounded-3xl bg-[#0A0B1A]/95 border border-red-500/30 shadow-2xl text-center space-y-4"
          >
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <span className="text-2xl" role="img" aria-label="warning">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-white">Something went wrong on this page</h2>
            <p className="text-xs text-zinc-400 font-mono break-words bg-black/40 p-3 rounded-xl border border-white/5 max-h-32 overflow-y-auto">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
              >
                Reload page
              </button>
              <button
                type="button"
                onClick={this.handleGoToDashboard}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all border border-white/10 active:scale-95 cursor-pointer"
              >
                Go to dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
