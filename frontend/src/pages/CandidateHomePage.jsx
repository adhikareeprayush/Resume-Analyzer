import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, EmptyState } from '../components/ui'
import {
  fetchCandidateApplications,
  fetchCandidateSuggestions
} from '../services/companyApi'

function formatDay(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function statusTone(status) {
  if (status === 'shortlisted' || status === 'hired') return 'ok'
  if (status === 'rejected') return 'warn'
  return 'neutral'
}

function CandidateHomePage() {
  const [apps, setApps] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [hasInterests, setHasInterests] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([fetchCandidateApplications(), fetchCandidateSuggestions()])
      .then(([rows, suggestionData]) => {
        if (!active) return
        setApps(rows)
        setSuggestions(suggestionData.suggestions || [])
        setHasInterests(Boolean(suggestionData.hasInterests))
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

  return (
    <div className="grid gap-10">
      <header className="border-b border-ink/10 pb-6">
        <p className="eyebrow">Job seeker</p>
        <h1 className="display-title mt-2.5 text-[1.75rem] text-ink">For you</h1>
        <p className="mt-3 max-w-[54ch] text-sm leading-7 text-muted">
          Suggested open roles from employers on TalentLens, plus the applications you’ve already
          submitted.
        </p>
      </header>

      {loading ? (
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Loading…</p>
      ) : null}
      {error ? <p className="alert alert-error">{error}</p> : null}

      {!loading ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-4">
            <div>
              <p className="eyebrow">Suggested roles</p>
              <h2 className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-ink">
                Matched to your interests
              </h2>
            </div>
            <Button as={Link} to="/candidate/profile" variant="secondary">
              Edit interests
            </Button>
          </div>

          {!hasInterests ? (
            <div className="mt-6">
              <EmptyState
                title="Add your interests"
                description="Skills, preferred roles, and location help us suggest open jobs you can apply to."
                action={
                  <Button as={Link} to="/candidate/profile" variant="primary">
                    Set interests
                  </Button>
                }
              />
            </div>
          ) : null}

          {hasInterests && suggestions.length === 0 ? (
            <p className="mt-6 text-sm text-muted">
              No strong matches right now. Check back as employers publish new roles, or broaden your
              interests.
            </p>
          ) : null}

          {suggestions.length > 0 ? (
            <ul className="mt-6 grid gap-4">
              {suggestions.map((item) => (
                <li key={`${item.jobId}-${item.formId}`} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="readout flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-medium text-paper">
                          {item.companyInitials || 'TL'}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-ink">{item.jobTitle}</p>
                          <p className="text-sm text-muted">{item.companyName}</p>
                        </div>
                      </div>
                      <p className="mt-3 max-w-[62ch] text-sm leading-6 text-muted">
                        {item.description || item.formTitle}
                      </p>
                      <p className="readout mt-2 text-xs text-faint">
                        {item.location || 'Location flexible'}
                        {item.mustHave?.length ? ` · ${item.mustHave.slice(0, 4).join(' · ')}` : ''}
                      </p>
                      {item.reasons?.length ? (
                        <p className="mt-2 text-xs leading-5 text-ok">{item.reasons.join(' · ')}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <p className="readout text-2xl font-medium text-ink">{item.matchScore}%</p>
                      <Badge tone={item.alreadyApplied ? 'neutral' : 'ok'}>
                        {item.alreadyApplied ? 'Applied' : 'Match'}
                      </Badge>
                      {item.alreadyApplied ? (
                        <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-faint">
                          Already applied
                        </span>
                      ) : (
                        <Button as={Link} to={item.applyPath} variant="primary">
                          Apply
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {!loading ? (
        <section>
          <div className="border-b border-ink/10 pb-4">
            <p className="eyebrow">Pipeline</p>
            <h2 className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-ink">
              My applications
            </h2>
          </div>

          {apps.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="No applications yet"
                description="Apply from a suggested role above, or use an employer’s apply link. Same-email submissions show up here."
              />
            </div>
          ) : (
            <ul className="panel mt-6 divide-y divide-ink/8">
              {apps.map((app) => (
                <li key={app.id} className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="readout flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-ink text-xs font-medium text-paper">
                        {app.companyInitials || 'TL'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">{app.jobTitle}</p>
                        <p className="text-sm text-muted">{app.companyName}</p>
                      </div>
                    </div>
                    <p className="readout mt-3 text-xs text-faint">
                      {app.formTitle}
                      {app.jobLocation ? ` · ${app.jobLocation}` : ''} · Applied{' '}
                      {formatDay(app.submittedAt)}
                    </p>
                  </div>
                  <Badge tone={statusTone(app.status)}>{app.status || 'new'}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  )
}

export default CandidateHomePage
