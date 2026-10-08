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
const ProfileSetup = lazy(() => import('./pages/ProfileSetup/ProfileSetup'))
const InternshipsPage = lazy(() => import('./pages/Internships/InternshipsPage'))
const AdminInternshipsPage = lazy(() => import('./pages/Admin/AdminInternshipsPage'))
const ResumeAnalyserPage = lazy(() => import('./pages/ResumeAnalyser/ResumeAnalyserPage'))
const CareerInterviewSupportPage = lazy(() => import('./pages/InterviewSupport/CareerInterviewSupportPage'))
const CareerPage = lazy(() => import('./pages/Career/CareerPage'))
const QuizzesPage = lazy(() => import('./pages/Quizzes/QuizzesPage'))
const SkillGraphPage = lazy(() => import('./pages/SkillGraph/SkillGraphPage'))
const ChallengesPage = lazy(() => import('./pages/Challenges/ChallengesPage'))
const ChallengeWorkspacePage = lazy(() => import('./pages/Challenges/ChallengeWorkspacePage'))
const AITutorPage = lazy(() => import('./pages/AITutor/AITutorPage'))
const CodeArenaPage = lazy(() => import('./pages/CodeArena/CodeArenaPage'))

const ConnectionsPage = lazy(() => import('./pages/Connections/ConnectionsPage'))

const routes = [
  { path: '/', element: <Home /> },
  { path: '/connections', element: <ConnectionsPage /> },
  { path: '/dashboard', element: <Dashboard /> },
  { path: '/workspace', element: <Dashboard /> },
  { path: '/internships', element: <InternshipsPage /> },
  { path: '/career', element: <CareerPage /> },
  { path: '/quizzes', element: <QuizzesPage /> },
  { path: '/skill-graph', element: <SkillGraphPage /> },
  { path: '/skill_graph', element: <SkillGraphPage /> },
  { path: '/my-skills', element: <SkillGraphPage /> },
  { path: '/skills', element: <SkillGraphPage /> },
  { path: '/challenges', element: <ChallengesPage /> },
  { path: '/challenges/:id', element: <ChallengeWorkspacePage /> },
  { path: '/ai-tutor', element: <AITutorPage /> },
  { path: '/code-arena', element: <CodeArenaPage /> },
  { path: '/admin/internships', element: <ProtectedRoute><AdminInternshipsPage /></ProtectedRoute> },
  { path: '/intern-hunt', element: <InternHunt /> },
  { path: '/resume-predictor', element: <ResumePredictor /> },
  { path: '/resume-analyser', element: <ResumeAnalyserPage /> },
  { path: '/interview-support', element: <CareerInterviewSupportPage /> },
  { path: '/rexcode', element: <CodeArenaPage /> },
  { path: '/rex-pro', element: <ProtectedRoute><RexPro /></ProtectedRoute> },
  { path: '/resume', element: <ResumePage /> },
  { path: '/login', element: <PublicOnlyRoute><Login /></PublicOnlyRoute> },
  { path: '/register', element: <PublicOnlyRoute><Register /></PublicOnlyRoute> },
  { path: '/profile-setup', element: <ProtectedRoute><ProfileSetup /></ProtectedRoute> },
  { path: '/profile', element: <ProtectedRoute><ProfileSetup /></ProtectedRoute> },
  { path: '*', element: <NotFound /> }
]

export default routes
