import { Component, ErrorInfo, ReactNode } from 'react';
import { trackError } from '../utils/errorTracker';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    trackError(error, 'component', { componentStack: errorInfo.componentStack });
  }

  handleReset = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 p-4">
          <div className="w-full max-w-md space-y-6 rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
              <svg
                className="h-7 w-7 text-indigo-600"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              エラーが発生しました
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              予期しないエラーが発生しました。再試行してください。
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 transition-all hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
            >
              再試行
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
