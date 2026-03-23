import { Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import routes from './routes'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'

function ErrorBoundary({ children }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState(null);

  const handleError = (errorEvent) => {
    setHasError(true);
    setError(errorEvent);
    console.error('App ErrorBoundary caught:', errorEvent);
  };

  if (hasError) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <h2>Something went wrong</h2>
        <p>Component failed to load. Check console for details.</p>
        <details style={{ textAlign: 'left', marginTop: '1rem' }}>
          <summary>Error details</summary>
          <pre style={{ background: '#f5f5f5', padding: '1rem', borderRadius: '4px', fontSize: '14px' }}>
            {error?.toString()}
          </pre>
        </details>
        <button 
          onClick={() => window.location.reload()} 
          style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}
        >
          Reload Page
        </button>
      </div>
    );
  }

  return children;
}

function App() {
  const location = useLocation()
  const isStandalonePage = location.pathname.startsWith('/rex-pro')

  return (
    <ErrorBoundary>
      <>
        {!isStandalonePage && <Navbar />}
        <main>
          <Suspense fallback={<div>Loading...</div>}>
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
