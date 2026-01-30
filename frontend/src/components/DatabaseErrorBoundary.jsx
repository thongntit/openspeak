import { Component } from 'react'

/**
 * Error boundary for catching database and service initialization errors
 * Wraps the app to handle catastrophic failures gracefully
 */
export default class DatabaseErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Database Error Boundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleRetry = () => {
    window.location.reload()
  }

  handleReset = () => {
    // Clear all database-related storage
    localStorage.removeItem('openspeak_db_last_sync')
    localStorage.removeItem('openspeak_db_version')
    localStorage.removeItem('openspeak_db_total_words')
    localStorage.removeItem('openspeak_db_etag')
    
    // Clear IndexedDB
    const req = indexedDB.deleteDatabase('OpenSpeakDB')
    req.onsuccess = () => {
      console.log('Database deleted successfully')
      window.location.reload()
    }
    req.onerror = () => {
      console.error('Failed to delete database')
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      const isDbError = this.state.error?.code === 'DB_NOT_READY' || 
                        this.state.error?.message?.includes('database') ||
                        this.state.error?.message?.includes('IndexedDB')

      return (
        <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c2630] rounded-xl p-8 shadow-sm border border-[#dbe0e6] dark:border-gray-800 max-w-md w-full">
            <div className="text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-2">
                {isDbError ? 'Database Error' : 'Something Went Wrong'}
              </h2>
              <p className="text-[#617589] dark:text-gray-400 mb-4 text-sm">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              {isDbError && (
                <p className="text-xs text-[#617589] dark:text-gray-500 mb-6">
                  This might be due to browser storage restrictions or corrupted data.
                </p>
              )}

              <div className="space-y-3">
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-[#137fec] text-white px-4 py-3 rounded-lg font-medium"
                >
                  Retry
                </button>
                
                {isDbError && (
                  <button
                    onClick={this.handleReset}
                    className="w-full bg-transparent border border-[#dbe0e6] dark:border-gray-700 text-[#617589] dark:text-gray-400 px-4 py-3 rounded-lg font-medium"
                  >
                    Reset Database
                  </button>
                )}
              </div>

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
