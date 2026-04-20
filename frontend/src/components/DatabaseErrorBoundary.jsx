import { Component } from 'react'

export default class DatabaseErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c2630] rounded-xl p-8 shadow-sm border border-[#dbe0e6] dark:border-gray-800 max-w-md w-full">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-2">
                Something Went Wrong
              </h2>
              <p className="text-[#617589] dark:text-gray-400 mb-6 text-sm">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-[#137fec] text-white px-4 py-3 rounded-lg font-medium"
              >
                Retry
              </button>
              {this.state.errorInfo && (
                <details className="mt-6 text-left">
                  <summary className="text-xs text-[#617589] dark:text-gray-500 cursor-pointer">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-900 rounded text-xs text-[#617589] dark:text-gray-400 overflow-auto max-h-32">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
