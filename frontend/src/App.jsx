import React, { Suspense, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import routes from './routes'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error)
    console.error('Error Info:', errorInfo)
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || 'Unknown error'
      const isModuleLoadError = message.includes('Failed to fetch dynamically imported module')
      
      return (
        <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
          <h2>⚠️ Failed to Load Component</h2>
          
          {isModuleLoadError ? (
            <>
              <p><strong>Backend Connection Issue:</strong></p>
              <p>The application backend server may not be running or responding.</p>
              <ol style={{ textAlign: 'left', display: 'inline-block', marginTop: '1rem' }}>
                <li>Ensure the backend server is running on port 5000</li>
                <li>Check if MongoDB is connected</li>
                <li>Check console for more details below</li>
              </ol>
            </>
          ) : (
            <>
              <p>Component failed to load. Check console for details.</p>
              <details style={{ textAlign: 'left', marginTop: '1rem', maxHeight: '300px', overflow: 'auto' }}>
                <summary>Error details</summary>
                <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', fontSize: '12px', overflow: 'auto' }}>
                  {this.state.error?.toString()}
                  {this.state.errorInfo && `\n\n${this.state.errorInfo.componentStack}`}
                </pre>
              </details>
            </>
          )}
          
          <button 
            onClick={() => window.location.href = '/'} 
            style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', fontSize: '16px', cursor: 'pointer' }}
          >
            Go to Home
          </button>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '1.5rem', marginLeft: '1rem', padding: '0.75rem 1.5rem', fontSize: '16px', cursor: 'pointer' }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const location = useLocation()
  const isStandalonePage = location.pathname.startsWith('/rex-pro')

  return (
    <ErrorBoundary>
      <>
        {!isStandalonePage && <Navbar />}
        <main>
          <Suspense fallback={
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Loading component...</p>
            </div>
          }>
            <Routes>
              {routes.map(({ path, element }) => (
                <Route key={path} path={path} element={element} />
              ))}
            </Routes>
          </Suspense>
        </main>
        {!isStandalonePage && <Footer />}
      </>
    </ErrorBoundary>
  )
}

export default App
