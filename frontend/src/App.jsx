import React, { Suspense } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
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
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error)
    console.error('Error Info:', errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '2rem',
            position: 'relative',
            zIndex: 5
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              borderRadius: '28px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(10, 14, 11, 0.9)',
              padding: '2rem',
              boxShadow: '0 24px 60px rgba(0,0,0,0.34)'
            }}
          >
            <p
              style={{
                color: 'rgba(179, 208, 255, 0.82)',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontSize: '0.72rem',
                marginBottom: '0.8rem'
              }}
            >
              Recovery Mode
            </p>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.8rem' }}>This surface failed to load.</h1>
            <p style={{ color: 'rgba(233, 240, 235, 0.7)', lineHeight: 1.7 }}>
              REXION hit a render failure. Refresh once, and if it happens again, return to the landing page and retry the flow.
            </p>
            {this.state.error?.message && (
              <pre
                style={{
                  marginTop: '1.25rem',
                  padding: '1rem',
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                  borderRadius: '18px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: 'rgba(233, 240, 235, 0.76)',
                  fontSize: '0.82rem'
                }}
              >
                {this.state.error.message}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', marginTop: '1.4rem' }}>
              <button
                onClick={this.handleReset}
                style={{
                  border: '1px solid rgba(82,139,255,0.28)',
                  background: 'linear-gradient(135deg, rgba(82,139,255,0.22), rgba(82,139,255,0.08))',
                  color: '#f5f7f5',
                  padding: '0.9rem 1.2rem',
                  borderRadius: '999px',
                  cursor: 'pointer'
                }}
              >
                Return Home
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent',
                  color: '#f5f7f5',
                  padding: '0.9rem 1.2rem',
                  borderRadius: '999px',
                  cursor: 'pointer'
                }}
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  const location = useLocation()
  const isStandalonePage =
    location.pathname.startsWith('/rex-pro') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/workspace')

  return (
    <ErrorBoundary>
      {!isStandalonePage && <Navbar />}
      <main>
        <Suspense
          fallback={
            <div
              style={{
                minHeight: '100vh',
                display: 'grid',
                placeItems: 'center',
                padding: '2rem',
                position: 'relative',
                zIndex: 5,
                color: 'rgba(233, 240, 235, 0.76)'
              }}
            >
              Loading the next REXION surface...
            </div>
          }
        >
          <Routes>
            {routes.map(({ path, element }) => (
              <Route key={path} path={path} element={element} />
            ))}
          </Routes>
        </Suspense>
      </main>
      {!isStandalonePage && <Footer />}
    </ErrorBoundary>
  )
}

export default App
