import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'
import ReloadPrompt from './components/ReloadPrompt'
import DatabaseErrorBoundary from './components/DatabaseErrorBoundary'
import OfflineIndicator from './components/OfflineIndicator'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const inner = (
  <DatabaseErrorBoundary>
    <ReloadPrompt />
    <App />
    <OfflineIndicator />
  </DatabaseErrorBoundary>
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {PUBLISHABLE_KEY
      ? <ClerkProvider publishableKey={PUBLISHABLE_KEY}>{inner}</ClerkProvider>
      : inner}
  </StrictMode>
)
