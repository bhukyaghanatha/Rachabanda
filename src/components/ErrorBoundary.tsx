import {
  Component,
  type ErrorInfo,
  type ReactNode,
} from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(
    error: Error
  ): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      error,
      errorInfo
    );
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[240px] flex items-center justify-center p-6">
          <div
            role="alert"
            className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-sm"
          >
            <div
              className="mb-3 text-3xl"
              aria-hidden="true"
            >
              ⚠️
            </div>

            <h2 className="mb-2 text-lg font-bold text-neutral-900">
              {this.props.fallbackTitle ||
                'పేజీ లోడ్ చేయడంలో లోపం ఏర్పడింది'}
            </h2>

            <p className="mb-5 text-sm text-neutral-600">
              Something went wrong while loading this section.
              Please try again.
            </p>

            <button
              type="button"
              onClick={this.handleRetry}
              className="rounded-xl bg-[#E41E26] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#B71C1C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E41E26] focus-visible:ring-offset-2"
            >
              మళ్లీ ప్రయత్నించండి / Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}