import { useState, useEffect } from 'react'
import wordService from '../services/wordService'

export default function AppLoader({ children }) {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    wordService.initialize()
      .then(() => {
        console.log('Word service initialized successfully')
        setIsReady(true)
      })
      .catch(err => {
        console.error('Failed to initialize word service:', err)
        setError(err.message)
      })
  }, [])

  if (error) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1c2630] rounded-xl p-8 shadow-sm border border-[#dbe0e6] dark:border-gray-800 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-2">
            Database Error
          </h2>
          <p className="text-[#617589] dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#137fec] text-white px-4 py-3 rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1c2630] rounded-xl p-8 shadow-sm border border-[#dbe0e6] dark:border-gray-800 max-w-md w-full text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#dbe0e6] dark:border-gray-700 border-t-[#137fec] rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-2">
            Loading Database
          </h2>
          <p className="text-[#617589] dark:text-gray-400">
            Downloading words for offline use...
          </p>
          <p className="text-sm text-[#617589] dark:text-gray-500 mt-2">
            This may take a moment on first load
          </p>
        </div>
      </div>
    )
  }

  return children
}
