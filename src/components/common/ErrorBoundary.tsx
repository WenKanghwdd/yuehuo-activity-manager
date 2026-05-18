import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center py-20 text-red-500">
            <p className="text-lg font-medium">页面出现错误</p>
            <p className="mt-2 text-sm text-red-400">{this.state.error?.message}</p>
            <button
              className="mt-4 rounded-lg bg-warm-500 px-4 py-2 text-white hover:bg-warm-600"
              onClick={() => this.setState({ hasError: false, error: undefined })}
            >
              重试
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
