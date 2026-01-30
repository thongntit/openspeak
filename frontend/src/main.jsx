import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ReloadPrompt from './components/ReloadPrompt'
import AppLoader from './components/AppLoader'
import DatabaseErrorBoundary from './components/DatabaseErrorBoundary'
import OfflineIndicator from './components/OfflineIndicator'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DatabaseErrorBoundary>
      <ReloadPrompt />
      <AppLoader>
        <App />
      </AppLoader>
      <OfflineIndicator />
    </DatabaseErrorBoundary>
  </StrictMode>
)
