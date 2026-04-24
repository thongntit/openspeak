import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'
import ReloadPrompt from './components/ReloadPrompt'
import AppLoader from './components/AppLoader'
import DatabaseErrorBoundary from './components/DatabaseErrorBoundary'
import OfflineIndicator from './components/OfflineIndicator'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
if (!PUBLISHABLE_KEY) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <DatabaseErrorBoundary>
        <ReloadPrompt />
        <AppLoader>
          <App />
        </AppLoader>
        <OfflineIndicator />
      </DatabaseErrorBoundary>
    </ClerkProvider>
  </StrictMode>
)
