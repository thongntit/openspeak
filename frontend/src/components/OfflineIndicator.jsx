import { useSyncExternalStore } from 'react'
import { WifiOff } from 'lucide-react'

// Subscribe to online status changes
const subscribeToOnlineStatus = (callback) => {
  window.addEventListener('online', callback)
  window.addEventListener('offline', callback)
  return () => {
    window.removeEventListener('online', callback)
    window.removeEventListener('offline', callback)
  }
}

const getOnlineStatus = () => navigator.onLine

// Check if using cached data
const checkIsUsingCache = () => {
  const lastSync = localStorage.getItem('openspeak_db_last_sync')
  const totalWords = localStorage.getItem('openspeak_db_total_words')
  return !!lastSync && !!totalWords
}

/**
 * Offline indicator component
 * Shows a subtle indicator when the app is offline or using cached data
 */
export default function OfflineIndicator() {
  const isOffline = !useSyncExternalStore(subscribeToOnlineStatus, getOnlineStatus)
  const isUsingCache = checkIsUsingCache()

  // Don't show if online and not using cache
  if (!isOffline && !isUsingCache) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="flex items-center gap-2 px-3 py-2 bg-[#1c2630] dark:bg-[#101922] text-white text-xs rounded-lg shadow-lg border border-gray-700">
        {isOffline ? (
          <>
            <WifiOff className="w-3 h-3" />
            <span>Offline Mode</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Using Cached Data</span>
          </>
        )}
      </div>
    </div>
  )
}
