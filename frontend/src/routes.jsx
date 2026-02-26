import { lazy } from 'react'

// Lazy loading (professional optimization 🚀)
const Home = lazy(() => import('./pages/Home/Home'))
const InternHunt = lazy(() => import('./pages/InternHunt/InternHunt'))
const ResumePredictor = lazy(() => import('./pages/ResumePredictor/ResumePredictor'))
const Rexcode = lazy(() => import('./pages/Rexcode/Rexcode'))
const Login = lazy(() => import('./pages/Login/Login'))
const Register = lazy(() => import('./pages/Register/Register'))
const NotFound = lazy(() => import('./pages/NotFound/NotFound'))

const routes = [
  { path: '/', element: <Home /> },
  { path: '/intern-hunt', element: <InternHunt /> },
  { path: '/resume-predictor', element: <ResumePredictor /> },
  { path: '/rexcode', element: <Rexcode /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '*', element: <NotFound /> }
]

export default routes
