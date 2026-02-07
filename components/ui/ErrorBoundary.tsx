'use client';

/**
 * ErrorBoundary - Catches and displays React errors gracefully
 */

import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-cosmic-slate via-cosmic-dark to-cosmic-darker">
          <div className="card-cosmic max-w-md text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-red-400 mb-2">
              Something went wrong
            </h2>

            <p className="text-gray-400 mb-6">
              The timeline encountered an unexpected error. Don't worry, your progress is saved.
            </p>

            {this.state.error && (
              <details className="text-left mb-6 bg-cosmic-dark p-4 rounded-lg">
                <summary className="text-sm text-gray-400 cursor-pointer mb-2">
                  Error details
                </summary>
                <code className="text-xs text-red-300 break-all">
                  {this.state.error.message}
                </code>
              </details>
            )}

            <button
              onClick={this.handleReset}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
