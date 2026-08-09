import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function LoadingShell({ label = 'Loading…' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
    </div>
  )
}

/** Any authenticated user */
function ProtectedRoute({ children }) {
  const { isAuthenticated, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <LoadingShell label="Loading…" />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

/** Company hiring workspace only */
export function CompanyRoute({ children }) {
  const { isAuthenticated, isCompanyUser, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <LoadingShell label="Loading workspace…" />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!isCompanyUser) {
    return <Navigate to="/candidate" replace />
  }
  return children
}

/** Candidate / job-seeker portal only */
export function CandidateRoute({ children }) {
  const { isAuthenticated, isCandidate, ready } = useAuth()
  const location = useLocation()

  if (!ready) return <LoadingShell label="Loading…" />
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (!isCandidate) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

export default ProtectedRoute
