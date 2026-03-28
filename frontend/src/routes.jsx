import { lazy } from 'react'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicOnlyRoute from './components/auth/PublicOnlyRoute'

const Home = lazy(() => import('./pages/Home/Home'))
const Dashboard = lazy(() => import('./pages/Workspace/WorkspaceSection'))
const InternHunt = lazy(() => import('./pages/InternHunt/InternHunt'))
const ResumePredictor = lazy(() => import('./pages/ResumePredictor/ResumePredictor'))
const Rexcode = lazy(() => import('./pages/Rexcode/Rexcode'))
const RexPro = lazy(() => import('./pages/RexPro/RexPro'))
const ResumePage = lazy(() => import('./pages/Resume/ResumePage'))
const Login = lazy(() => import('./pages/Login/Login'))
const Register = lazy(() => import('./pages/Register/Register'))
const NotFound = lazy(() => import('./pages/NotFound/NotFound'))

const routes = [
  { path: '/', element: <Home /> },
  { path: '/dashboard', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: '/workspace', element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
  { path: '/intern-hunt', element: <ProtectedRoute><InternHunt /></ProtectedRoute> },
  { path: '/resume-predictor', element: <ProtectedRoute><ResumePredictor /></ProtectedRoute> },
  { path: '/rexcode', element: <ProtectedRoute><Rexcode /></ProtectedRoute> },
  { path: '/rex-pro', element: <ProtectedRoute><RexPro /></ProtectedRoute> },
  { path: '/resume', element: <ProtectedRoute><ResumePage /></ProtectedRoute> },
  { path: '/login', element: <PublicOnlyRoute><Login /></PublicOnlyRoute> },
  { path: '/register', element: <PublicOnlyRoute><Register /></PublicOnlyRoute> },
  { path: '*', element: <NotFound /> }
]

export default routes
