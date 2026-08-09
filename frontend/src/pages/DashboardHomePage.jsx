import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button, Card, DashboardPage, EmptyState, StatCard } from '../components/ui'
import AnalysisHistoryCard from '../components/dashboard/AnalysisHistoryCard'
import GettingStarted from '../components/dashboard/GettingStarted'
import { useAuth } from '../context/AuthContext'
import { fetchDashboardOverview } from '../services/companyApi'

function formatDay(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function DashboardHomePage() {
  const { company } = useAuth()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetchDashboardOverview()
      .then((data) => {
        if (active) setOverview(data)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const stats = overview?.stats ?? {
    jobs: 0,
    openJobs: 0,
    forms: 0,
    publishedForms: 0,
    submissions: 0
  }
  const recentSubmissions = overview?.recentSubmissions ?? []
  const isNewWorkspace = stats.jobs === 0

  return (
    <DashboardPage
      eyebrow={company?.name ?? 'Workspace'}
      title="Overview"
      description={
        isNewWorkspace
          ? 'Set up your first role to start collecting and ranking applications.'
          : 'Hiring activity across your open roles.'
      }
      actions={
        isNewWorkspace ? (
          <Button as={Link} to="/dashboard/jobs/new" variant="primary">
            Create first job
          </Button>
        ) : (
          <>
            <Button as={Link} to="/dashboard/analyze" variant="secondary">
              Analyze resumes
            </Button>
            <Button as={Link} to="/dashboard/jobs/new" variant="primary">
              New job
            </Button>
          </>
        )
      }
    >
      {error ? <p className="alert alert-error">{error}</p> : null}
      {loading ? (
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Loading workspace…</p>
      ) : null}

      {!loading && !isNewWorkspace ? (
        <section className="grid grid-cols-2 gap-6 xl:grid-cols-4 xl:gap-8">
          <StatCard label="Open jobs" value={stats.openJobs ?? stats.jobs} />
          <StatCard label="Forms" value={stats.forms} />
          <StatCard label="Live links" value={stats.publishedForms} />
          <StatCard label="Applications" value={stats.submissions} hint="All time" />
        </section>
      ) : null}

      {!loading ? (
        <GettingStarted
          hasJobs={stats.jobs > 0}
          hasForms={stats.forms > 0}
          hasSubmissions={stats.submissions > 0}
        />
      ) : null}

      {!loading && !isNewWorkspace ? (
        <section className="grid gap-6 lg:grid-cols-2">
          <Card eyebrow="Inbox" title="Recent applications" padding="sm">
            {recentSubmissions.length === 0 ? (
              <EmptyState
                bare
                title="No applications yet"
                description="Publish a form and share the link with candidates."
                action={
                  <Button as={Link} to="/dashboard/jobs" variant="primary">
                    Go to jobs
                  </Button>
                }
              />
            ) : (
              <ul className="-mt-1">
                {recentSubmissions.map((sub) => (
                  <li key={sub.id} className="border-b border-ink/8 last:border-b-0">
                    <Link
                      to={`/dashboard/jobs/${sub.jobId}/forms/${sub.formId}/submissions`}
                      className="flex flex-wrap items-center justify-between gap-4 py-3.5 transition hover:bg-paper/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{sub.candidateName}</p>
                        <p className="truncate text-sm text-muted">{sub.email}</p>
                      </div>
                      <p className="readout shrink-0 text-xs text-faint">
                        {formatDay(sub.submittedAt)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <AnalysisHistoryCard limit={5} />
        </section>
      ) : null}
    </DashboardPage>
  )
}

export default DashboardHomePage
