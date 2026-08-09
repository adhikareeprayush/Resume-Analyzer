import { Link } from 'react-router-dom'
import { Button, Card } from '../ui'
import { useAnalysisHistory } from '../../hooks/useAnalysisHistory'

function formatRunDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function HistorySkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton h-12 w-full" />
      ))}
    </div>
  )
}

function AnalysisHistoryCard({ limit = 5 }) {
  const { history, loading } = useAnalysisHistory(limit)

  if (loading) {
    return (
      <Card eyebrow="Analysis" title="Recent runs" padding="sm">
        <HistorySkeleton />
      </Card>
    )
  }

  if (history.length === 0) {
    return (
      <Card eyebrow="Analysis" title="Recent runs" padding="sm">
        <p className="text-sm leading-6 text-muted">
          No runs yet. Upload resumes on the analysis page to rank candidates against a role.
        </p>
        <Button as={Link} to="/dashboard/analyze" variant="secondary" className="mt-5">
          Run first analysis
        </Button>
      </Card>
    )
  }

  return (
    <Card eyebrow="Analysis" title="Recent runs" padding="sm">
      <ul className="-mt-1">
        {history.map((run) => (
          <li
            key={run.analysisId || `${run.jobTitle}-${run.processedAt}`}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/8 py-3.5 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{run.jobTitle}</p>
              <p className="readout mt-1 text-xs text-muted">
                {run.totalResumes} {run.totalResumes === 1 ? 'resume' : 'resumes'} · avg{' '}
                {run.avgScore}% · top {run.topScore}%
              </p>
            </div>
            {run.processedAt ? (
              <p className="readout shrink-0 text-xs text-faint">{formatRunDate(run.processedAt)}</p>
            ) : null}
          </li>
        ))}
      </ul>
      <Button as={Link} to="/dashboard/analyze" variant="secondary" className="mt-5">
        New analysis
      </Button>
    </Card>
  )
}

export default AnalysisHistoryCard
