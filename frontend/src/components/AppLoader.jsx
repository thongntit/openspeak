import { useState, useEffect } from 'react'
import { getHealth } from '../services/openspeakApi'

export default function AppLoader({ children }) {
  const [status, setStatus] = useState('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    getHealth()
      .then(() => setStatus('ready'))
      .catch((err) => {
        setErrorMsg(err.message || 'Backend is unreachable')
        setStatus('error')
      })
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1c2630] rounded-xl p-8 shadow-sm border border-[#dbe0e6] dark:border-gray-800 max-w-md w-full text-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#dbe0e6] dark:border-gray-700 border-t-[#137fec] rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-2">Connecting...</h2>
          <p className="text-[#617589] dark:text-gray-400">Checking backend connection</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-[#f6f7f8] dark:bg-[#101922] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-[#1c2630] rounded-xl p-8 shadow-sm border border-[#dbe0e6] dark:border-gray-800 max-w-md w-full text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-2">Connection Error</h2>
          <p className="text-[#617589] dark:text-gray-400 mb-4">{errorMsg}</p>
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

  return children
}
