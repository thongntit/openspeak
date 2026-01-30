import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ReloadPrompt from './components/ReloadPrompt'
import AppLoader from './components/AppLoader'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ReloadPrompt />
    <AppLoader>
      <App />
    </AppLoader>
  </StrictMode>
)
