'use client';
import React from 'react';

interface Props { children: React.ReactNode; label?: string; }
interface State { error: Error | null; }

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary: ${this.props.label}]`, error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl m-4"
          style={{ backgroundColor: 'rgba(244,63,94,0.08)', border: '2px solid rgba(244,63,94,0.2)' }}>
          <span className="text-5xl mb-4">⚠️</span>
          <h3 className="font-bold uppercase text-2xl mb-2 text-rose-400">
            {this.props.label || 'Component'} Error
          </h3>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm font-mono mb-6 max-w-md">
            {this.state.error.message}
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
