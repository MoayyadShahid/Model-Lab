"use client";

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const Fallback = this.props.fallback;
        return <Fallback error={this.state.error!} retry={this.retry} />;
      }

      return (
        <div className="flex items-center justify-center min-h-[400px] p-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-6">
              {this.state.error?.message || 'An unexpected error occurred. Please try again.'}
            </p>
            <Button
              onClick={this.retry}
              className="bg-gradient-to-r from-[#7A4BE3] to-[#9333EA] hover:from-[#6A3BD3] hover:to-[#8B2FC7]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Chat-specific error fallback
export function ChatErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="flex items-center justify-center h-full bg-white p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Chat Error
        </h2>
        <p className="text-gray-600 mb-6">
          There was an error with the chat system. {error.message}
        </p>
        <div className="space-y-3">
          <Button
            onClick={retry}
            className="w-full bg-gradient-to-r from-[#7A4BE3] to-[#9333EA] hover:from-[#6A3BD3] hover:to-[#8B2FC7]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full"
          >
            Reload Page
          </Button>
        </div>
      </div>
    </div>
  );
}

