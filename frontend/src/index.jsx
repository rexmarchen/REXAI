import React from 'react'
import ReactDOM from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { BrowserRouter } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import { AuthProvider } from './context/AuthContext'
import { GOOGLE_CLIENT_ID, isGoogleAuthConfigured } from './config/googleAuth'
import App from './App'
import './styles/globals.css'
import './styles/variables.css'
import './styles/animations.css'

const appTree = (
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AuthProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)

ReactDOM.createRoot(document.getElementById('root')).render(
  isGoogleAuthConfigured()
    ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{appTree}</GoogleOAuthProvider>
    : appTree
)
