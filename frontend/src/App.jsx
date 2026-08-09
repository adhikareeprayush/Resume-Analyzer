import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CandidateRoute, CompanyRoute } from './components/ProtectedRoute'
import CandidateLayout from './layouts/CandidateLayout'
import DashboardLayout from './layouts/DashboardLayout'
import AnalyzePage from './pages/AnalyzePage'
import ApplyPage from './pages/ApplyPage'
import CandidateHomePage from './pages/CandidateHomePage'
import CandidateProfilePage from './pages/CandidateProfilePage'
import CandidateSignupPage from './pages/CandidateSignupPage'
import CompanyJobsPage from './pages/CompanyJobsPage'
import DashboardHomePage from './pages/DashboardHomePage'
import FormSubmissionsPage from './pages/FormSubmissionsPage'
import JobDetailPage from './pages/JobDetailPage'
import JobEditorPage from './pages/JobEditorPage'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SettingsPage from './pages/SettingsPage'
import SignupPage from './pages/SignupPage'
const FormBuilderPage = lazy(() => import('./pages/FormBuilderPage'))

function RouteFallback() {
  return (
    <div className="dashboard-page-wide">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
        Preparing the form builder…
      </p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/candidate/signup" element={<CandidateSignupPage />} />
      <Route path="/apply/:slug" element={<ApplyPage />} />

      <Route
        path="/dashboard"
        element={
          <CompanyRoute>
            <DashboardLayout />
          </CompanyRoute>
        }
      >
        <Route index element={<DashboardHomePage />} />
        <Route path="jobs" element={<CompanyJobsPage />} />
        <Route path="jobs/new" element={<JobEditorPage />} />
        <Route path="jobs/:jobId" element={<JobDetailPage />} />
        <Route path="jobs/:jobId/edit" element={<JobEditorPage />} />
        <Route path="jobs/:jobId/forms/new" element={<Suspense fallback={<RouteFallback />}><FormBuilderPage /></Suspense>} />
        <Route path="jobs/:jobId/forms/:formId/edit" element={<Suspense fallback={<RouteFallback />}><FormBuilderPage /></Suspense>} />
        <Route path="jobs/:jobId/forms/:formId/submissions" element={<FormSubmissionsPage />} />
        <Route path="analyze" element={<AnalyzePage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      <Route
        path="/candidate"
        element={
          <CandidateRoute>
            <CandidateLayout />
          </CandidateRoute>
        }
      >
        <Route index element={<CandidateHomePage />} />
        <Route path="profile" element={<CandidateProfilePage />} />
      </Route>

      <Route path="/analyze" element={<Navigate to="/dashboard/analyze" replace />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
