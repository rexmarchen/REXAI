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
const ActivityTrackerPage = lazy(() => import('./pages/ActivityTracker/ActivityTrackerPage'))

const ConnectionsPage = lazy(() => import('./pages/Connections/ConnectionsPage'))
const PrivacyPolicy = lazy(() => import('./pages/Legal/PrivacyPolicy'))
const TermsAndConditions = lazy(() => import('./pages/Legal/TermsAndConditions'))

// Developer Portal components
import DeveloperRoute from './components/auth/DeveloperRoute'
const DeveloperLayout = lazy(() => import('./pages/Developer/DeveloperLayout'))
const DeveloperDashboardPage = lazy(() => import('./pages/Developer/DeveloperDashboardPage'))
const DeveloperQuizzesPage = lazy(() => import('./pages/Developer/DeveloperQuizzesPage'))
const DeveloperQuizCreatePage = lazy(() => import('./pages/Developer/DeveloperQuizCreatePage'))
const DeveloperQuizEditorPage = lazy(() => import('./pages/Developer/DeveloperQuizEditorPage'))
const DeveloperPreviewPage = lazy(() => import('./pages/Developer/DeveloperPreviewPage'))
const DeveloperQuestionsPage = lazy(() => import('./pages/Developer/DeveloperQuestionsPage'))
const DeveloperAnalyticsPage = lazy(() => import('./pages/Developer/DeveloperAnalyticsPage'))
const DeveloperApplyPage = lazy(() => import('./pages/Developer/DeveloperApplyPage'))
const AdminDevelopersPage = lazy(() => import('./pages/Admin/AdminDevelopersPage'))
const AdminDashboardPage = lazy(() => import('./pages/Admin/AdminDashboardPage'))

// Faculty & Educator Portal components
import FacultyRoute from './components/auth/FacultyRoute'
const FacultyLayout = lazy(() => import('./pages/Faculty/FacultyLayout'))
const FacultyDashboardPage = lazy(() => import('./pages/Faculty/FacultyDashboardPage'))
const FacultyQuizzesPage = lazy(() => import('./pages/Faculty/FacultyQuizzesPage'))
const FacultyQuizCreatePage = lazy(() => import('./pages/Faculty/FacultyQuizCreatePage'))
const FacultyQuizEditorPage = lazy(() => import('./pages/Faculty/FacultyQuizEditorPage'))
const FacultyPreviewPage = lazy(() => import('./pages/Faculty/FacultyPreviewPage'))
const FacultyQuestionsPage = lazy(() => import('./pages/Faculty/FacultyQuestionsPage'))
const FacultyAnalyticsPage = lazy(() => import('./pages/Faculty/FacultyAnalyticsPage'))
const FacultyProfilePage = lazy(() => import('./pages/Faculty/FacultyProfilePage'))
const FacultyVerificationPage = lazy(() => import('./pages/Faculty/FacultyVerificationPage'))
const AdminFacultyPage = lazy(() => import('./pages/Admin/AdminFacultyPage'))

const routes = [
  { path: '/', element: <Home /> },
  { path: '/privacy', element: <PrivacyPolicy /> },
  { path: '/terms', element: <TermsAndConditions /> },
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
  { path: '/activity', element: <ProtectedRoute><ActivityTrackerPage /></ProtectedRoute> },
  { path: '/activity-tracker', element: <ProtectedRoute><ActivityTrackerPage /></ProtectedRoute> },
  { path: '/admin', element: <FacultyRoute requireAdmin><AdminDashboardPage /></FacultyRoute> },
  { path: '/admin/users', element: <FacultyRoute requireAdmin><AdminDashboardPage /></FacultyRoute> },
  { path: '/admin/internships', element: <FacultyRoute requireAdmin><AdminInternshipsPage /></FacultyRoute> },
  { path: '/admin/developers', element: <DeveloperRoute requireAdmin><DeveloperLayout pageTitle="Developer Moderation"><AdminDevelopersPage /></DeveloperLayout></DeveloperRoute> },
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

  // Developer Portal Routes
  { path: '/developer/apply', element: <ProtectedRoute><DeveloperApplyPage /></ProtectedRoute> },
  { path: '/developer', element: <DeveloperRoute><DeveloperLayout pageTitle="Developer Dashboard"><DeveloperDashboardPage /></DeveloperLayout></DeveloperRoute> },
  { path: '/developer/quizzes', element: <DeveloperRoute><DeveloperLayout pageTitle="Technical Quizzes"><DeveloperQuizzesPage /></DeveloperLayout></DeveloperRoute> },
  { path: '/developer/quizzes/new', element: <DeveloperRoute><DeveloperLayout pageTitle="Create New Quiz"><DeveloperQuizCreatePage /></DeveloperLayout></DeveloperRoute> },
  { path: '/developer/quizzes/:quizId/edit', element: <DeveloperRoute><DeveloperLayout pageTitle="Quiz & Question Editor"><DeveloperQuizEditorPage /></DeveloperLayout></DeveloperRoute> },
  { path: '/developer/quizzes/:quizId/preview', element: <DeveloperRoute><DeveloperLayout pageTitle="Candidate Preview"><DeveloperPreviewPage /></DeveloperLayout></DeveloperRoute> },
  { path: '/developer/questions', element: <DeveloperRoute><DeveloperLayout pageTitle="Global Question Bank"><DeveloperQuestionsPage /></DeveloperLayout></DeveloperRoute> },
  { path: '/developer/analytics', element: <DeveloperRoute><DeveloperLayout pageTitle="Assessment Analytics"><DeveloperAnalyticsPage /></DeveloperLayout></DeveloperRoute> },

  // Faculty & Educator Portal Routes
  { path: '/faculty', element: <FacultyRoute><FacultyLayout pageTitle="Faculty Dashboard"><FacultyDashboardPage /></FacultyLayout></FacultyRoute> },
  { path: '/faculty/quizzes', element: <FacultyRoute><FacultyLayout pageTitle="Educational Quizzes"><FacultyQuizzesPage /></FacultyLayout></FacultyRoute> },
  { path: '/faculty/quizzes/new', element: <FacultyRoute><FacultyLayout pageTitle="Create Educational Quiz"><FacultyQuizCreatePage /></FacultyLayout></FacultyRoute> },
  { path: '/faculty/quizzes/:quizId/edit', element: <FacultyRoute><FacultyLayout pageTitle="Quiz & Question Pool Editor"><FacultyQuizEditorPage /></FacultyLayout></FacultyRoute> },
  { path: '/faculty/quizzes/:quizId/preview', element: <FacultyRoute><FacultyLayout pageTitle="Candidate Preview Simulator"><FacultyPreviewPage /></FacultyLayout></FacultyRoute> },
  { path: '/faculty/questions', element: <FacultyRoute><FacultyLayout pageTitle="Faculty Question Bank"><FacultyQuestionsPage /></FacultyLayout></FacultyRoute> },
  { path: '/faculty/analytics', element: <FacultyRoute><FacultyLayout pageTitle="Cohort Results & Analytics"><FacultyAnalyticsPage /></FacultyLayout></FacultyRoute> },
  { path: '/faculty/profile', element: <FacultyRoute><FacultyLayout pageTitle="Educator Profile & Qualifications"><FacultyProfilePage /></FacultyLayout></FacultyRoute> },
  { path: '/faculty/verification', element: <FacultyRoute><FacultyLayout pageTitle="Faculty Verification & Trust"><FacultyVerificationPage /></FacultyLayout></FacultyRoute> },

  // Admin Faculty Verification Moderation Route
  { path: '/admin/faculty', element: <FacultyRoute requireAdmin><AdminFacultyPage /></FacultyRoute> },

  { path: '*', element: <NotFound /> }
]

export default routes
