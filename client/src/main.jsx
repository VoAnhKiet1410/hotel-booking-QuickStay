import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import { viVN } from '@clerk/localizations'
import { AppProvider } from './context/AppContext.jsx'
import { SocketContextProvider } from './context/SocketContext.jsx'
import { ChatSocketProvider } from './context/ChatSocketContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Add your Clerk Publishable Key to the .env file')
}

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} localization={viVN}>
      <BrowserRouter>
        <AppProvider>
          <SocketContextProvider>
            <ChatSocketProvider>
              <App />
            </ChatSocketProvider>
          </SocketContextProvider>
        </AppProvider>
      </BrowserRouter>
    </ClerkProvider>
  </ErrorBoundary>,
)
