import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Button,
  Card,
  DashboardPage,
  EmptyState,
  FitLabel,
  Spinner,
  StatCard
} from '../components/ui'
import { fitTone } from '../utils/fit'
import {
  analyzeFormSubmissions,
  downloadSubmissionResume,
  fetchForm,
  fetchFormAnalysis,
  fetchJob,
  fetchSubmissions,
  updateSubmission
} from '../services/companyApi'

const AnalysisCharts = lazy(() => import('../components/AnalysisCharts'))

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'hired', label: 'Hired' }
]

function statusTone(status) {
  if (status === 'shortlisted' || status === 'hired') return 'ok'
  if (status === 'rejected') return 'warn'
  if (status === 'reviewed') return 'neutral'
  return 'ink'
}

function formatSubmittedAt(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function formatAnswer(value) {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  if (value == null || value === '') return '—'
  if (Array.isArray(value)) return value.join(', ') || '—'
  return String(value)
}

function FormSubmissionsPage() {
  const { jobId, formId } = useParams()
  const [job, setJob] = useState(null)
  const [form, setForm] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [analysis, setAnalysis] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const [jobData, formData, rows] = await Promise.all([
          fetchJob(jobId),
          fetchForm(formId),
          fetchSubmissions(formId)
        ])
        if (!active) return
        if (formData.jobId !== jobId) {
          setError('This form does not belong to the selected job.')
          return
        }
        setJob(jobData)
        setForm(formData)
        setSubmissions(rows)
        setSelectedId(rows[0]?.id ?? null)

        try {
          const analysisData = await fetchFormAnalysis(formId)
          if (active) setAnalysis(analysisData)
        } catch {
          if (active) setAnalysis(null)
        }
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [jobId, formId])

  const rankingBySubmission = useMemo(() => {
    const map = {}
    for (const row of analysis?.rankedResumes || []) {
      if (row.submissionId) map[row.submissionId] = row
    }
    return map
  }, [analysis])

  const selected = submissions.find((sub) => sub.id === selectedId) || null
  const selectedRank = selected ? rankingBySubmission[selected.id] : null
  const fields = form?.fields || []
  const topThree = analysis?.rankedResumes?.slice(0, 3) ?? []

  const handleAnalyze = async () => {
    setAnalyzing(true)
    setNotice('')
    try {
      const result = await analyzeFormSubmissions(formId)
      setAnalysis(result)
      setNotice('Applicants ranked against this role.')
    } catch (err) {
      setNotice(err.message || 'Analysis failed.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleStatusChange = async (status) => {
    if (!selected) return
    try {
      const updated = await updateSubmission(selected.id, { status })
      setSubmissions((rows) => rows.map((row) => (row.id === updated.id ? updated : row)))
      setNotice(`Marked as ${status}.`)
    } catch (err) {
      setNotice(err.message || 'Could not update status.')
    }
  }

  const handleDownloadResume = async () => {
    if (!selected?.hasResumeFile) return
    try {
      await downloadSubmissionResume(selected.id, selected.resumeFilename)
    } catch (err) {
      setNotice(err.message || 'Could not download resume.')
    }
  }

  if (loading) {
    return (
      <DashboardPage title="Submissions">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
          Loading submissions…
        </p>
      </DashboardPage>
    )
  }

  if (error || !job || !form) {
    return (
      <DashboardPage
        title="Submissions"
        breadcrumbs={[{ label: 'Jobs', to: '/dashboard/jobs' }, { label: 'Not found' }]}
      >
        <EmptyState
          title="Couldn’t load submissions"
          description={error || 'This form or job may have been removed.'}
          action={
            <Button as={Link} to={`/dashboard/jobs/${jobId}`} variant="primary">
              Back to job
            </Button>
          }
        />
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      wide
      eyebrow={job.title}
      title="Applications & ranking"
      description={`${form.title} · ${submissions.length} application${
        submissions.length === 1 ? '' : 's'
      }`}
      breadcrumbs={[
        { label: 'Jobs', to: '/dashboard/jobs' },
        { label: job.title, to: `/dashboard/jobs/${job.id}` },
        { label: 'Applications' }
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          {submissions.length > 0 ? (
            <Button variant="primary" onClick={handleAnalyze} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Spinner />
                  Ranking…
                </>
              ) : analysis ? (
                'Re-rank applicants'
              ) : (
                'Rank applicants'
              )}
            </Button>
          ) : null}
          <Button
            as={Link}
            to={`/dashboard/jobs/${job.id}/forms/${form.id}/edit`}
            variant="secondary"
          >
            Edit form
          </Button>
          <Button as={Link} to={`/dashboard/jobs/${job.id}`} variant="ghost">
            Back to job
          </Button>
        </div>
      }
    >
      {notice ? (
        <Alert
          tone={
            /fail|could not|error/i.test(notice)
              ? 'warning'
              : 'success'
          }
          onDismiss={() => setNotice('')}
        >
          {notice}
        </Alert>
      ) : null}

      {submissions.length === 0 ? (
        <EmptyState
          title="No submissions yet"
          description="Share the public form link. Applications will show up here for ranking."
          action={
            <Button as={Link} to={`/dashboard/jobs/${job.id}`} variant="primary">
              View form link
            </Button>
          }
        />
      ) : (
        <>
          {analysis ? (
            <section className="grid gap-6 sm:grid-cols-3 sm:gap-8">
              <StatCard
                label="Applicants ranked"
                value={analysis.summary?.totalResumes ?? 0}
                hint="This form"
              />
              <StatCard
                label="Average match"
                value={`${analysis.summary?.avgScore ?? 0}%`}
              />
              <StatCard
                label="Top score"
                value={`${analysis.summary?.topScore ?? 0}%`}
                accent="signal"
              />
            </section>
          ) : (
            <Card
              eyebrow="Ranking"
              title="Rank these applicants"
              description="Score every submission against this job’s description and must-have skills."
              padding="sm"
            >
              <Button variant="primary" onClick={handleAnalyze} disabled={analyzing}>
                {analyzing ? (
                  <>
                    <Spinner />
                    Ranking…
                  </>
                ) : (
                  'Run analysis'
                )}
              </Button>
            </Card>
          )}

          {topThree.length > 0 ? (
            <Card variant="ink" eyebrow="Shortlist" title="Top ranked for this form">
              <ul className="grid gap-5">
                {topThree.map((resume, index) => (
                  <li key={resume.id} className="border-t border-white/12 pt-5">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => resume.submissionId && setSelectedId(resume.submissionId)}
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <p className="flex items-baseline gap-3 text-base font-medium text-paper">
                          <span className="readout text-signal-hot">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {resume.candidateName || resume.resumeName}
                        </p>
                        <p className="readout text-2xl font-medium text-paper">{resume.score}%</p>
                      </div>
                      <FitLabel label={resume.fitLabel} className="mt-2" />
                      {resume.recommendation ? (
                        <p className="mt-3 max-w-[76ch] text-sm leading-6 text-paper/80">
                          {resume.recommendation}
                        </p>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {analysis ? (
            <Suspense
              fallback={
                <Card
                  eyebrow="Analytics"
                  title="Loading charts…"
                  description="Preparing distribution and shortlist visuals."
                />
              }
            >
              <AnalysisCharts analysis={analysis} />
            </Suspense>
          ) : null}

          <section className="animate-rise grid gap-6 lg:grid-cols-[minmax(0,17rem)_1fr] xl:grid-cols-[minmax(0,20rem)_1fr]">
            <div className="panel overflow-hidden">
              <div className="border-b border-ink/10 px-4 py-3.5">
                <p className="eyebrow">Candidates</p>
                <p className="readout mt-1 text-xs text-muted">{submissions.length} total</p>
              </div>
              <ul className="max-h-[min(70vh,36rem)] overflow-y-auto">
                {[...submissions]
                  .sort((a, b) => {
                    const scoreA = rankingBySubmission[a.id]?.score ?? -1
                    const scoreB = rankingBySubmission[b.id]?.score ?? -1
                    return scoreB - scoreA
                  })
                  .map((sub) => {
                    const isActive = sub.id === selectedId
                    const rank = rankingBySubmission[sub.id]
                    return (
                      <li key={sub.id} className="border-b border-ink/8 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setSelectedId(sub.id)}
                          className={`w-full px-4 py-3.5 text-left transition ${
                            isActive ? 'bg-ink/[0.04]' : 'hover:bg-paper/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-ink">
                                {sub.candidateName}
                              </p>
                              <p className="mt-0.5 truncate text-sm text-muted">{sub.email}</p>
                            </div>
                            {rank ? (
                              <p className="readout shrink-0 text-sm font-medium text-ink">
                                {rank.score}%
                              </p>
                            ) : null}
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <Badge tone={statusTone(sub.status)}>{sub.status || 'new'}</Badge>
                            {rank?.fitLabel ? (
                              <Badge tone={fitTone(rank.fitLabel)}>{rank.fitLabel}</Badge>
                            ) : null}
                            <p className="readout text-[0.7rem] text-faint">
                              {formatSubmittedAt(sub.submittedAt)}
                            </p>
                          </div>
                        </button>
                      </li>
                    )
                  })}
              </ul>
            </div>

            <div className="panel p-5 md:p-6">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-5">
                    <div className="min-w-0">
                      <p className="eyebrow">Application</p>
                      <h2 className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-ink">
                        {selected.candidateName}
                      </h2>
                      <p className="mt-1.5 text-sm text-muted">
                        <a
                          href={`mailto:${selected.email}`}
                          className="transition hover:text-ink"
                        >
                          {selected.email}
                        </a>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge tone="neutral">{formatSubmittedAt(selected.submittedAt)}</Badge>
                      {selectedRank ? (
                        <p className="readout text-2xl font-medium text-ink">
                          {selectedRank.score}%
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-end gap-3 border-b border-ink/10 pb-6">
                    <label className="grid gap-2">
                      <span className="field-label">Pipeline status</span>
                      <select
                        className="field-input min-w-[10rem]"
                        value={selected.status || 'new'}
                        onChange={(e) => handleStatusChange(e.target.value)}
                      >
                        {STATUS_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    {selected.hasResumeFile ? (
                      <Button type="button" variant="secondary" onClick={handleDownloadResume}>
                        Download resume
                      </Button>
                    ) : null}
                  </div>

                  {selectedRank ? (
                    <div className="mt-6 border-b border-ink/10 pb-6">
                      <p className="eyebrow">Fit analysis</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge tone={fitTone(selectedRank.fitLabel)}>
                          {selectedRank.fitLabel}
                        </Badge>
                        <span className="readout text-xs text-muted">
                          {selectedRank.keywordCoverage ?? 0}% skill coverage
                        </span>
                      </div>
                      {selectedRank.recommendation ? (
                        <p className="mt-3 max-w-[70ch] text-sm leading-6 text-muted">
                          {selectedRank.recommendation}
                        </p>
                      ) : null}
                      {selectedRank.explanation ? (
                        <p className="mt-2 max-w-[70ch] text-sm leading-6 text-faint">
                          {selectedRank.explanation}
                        </p>
                      ) : null}
                      {(selectedRank.matchedKeywords?.length ||
                        selectedRank.missingKeywords?.length) && (
                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          {selectedRank.matchedKeywords?.length ? (
                            <div>
                              <dt className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-faint">
                                Matched
                              </dt>
                              <dd className="mt-1.5 leading-6 text-ok">
                                {selectedRank.matchedKeywords.join(' · ')}
                              </dd>
                            </div>
                          ) : null}
                          {selectedRank.missingKeywords?.length ? (
                            <div>
                              <dt className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-faint">
                                Missing
                              </dt>
                              <dd className="mt-1.5 leading-6 text-warn">
                                {selectedRank.missingKeywords.join(' · ')}
                              </dd>
                            </div>
                          ) : null}
                        </dl>
                      )}
                    </div>
                  ) : null}

                  <div className="mt-6">
                    <p className="eyebrow">Answers</p>
                    {fields.length === 0 ? (
                      <p className="mt-4 text-sm text-muted">This form has no field definitions.</p>
                    ) : (
                      <dl className="mt-4 grid gap-0">
                        {fields.map((field) => (
                          <div
                            key={field.id}
                            className="grid gap-1 border-b border-ink/8 py-4 last:border-b-0 sm:grid-cols-[minmax(0,12rem)_1fr] sm:gap-6"
                          >
                            <dt className="text-sm font-medium text-ink">{field.label}</dt>
                            <dd className="whitespace-pre-wrap text-sm leading-6 text-muted">
                              {formatAnswer(selected.answers?.[field.id])}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted">Select a candidate to view their answers.</p>
              )}
            </div>
          </section>
        </>
      )}
    </DashboardPage>
  )
}

export default FormSubmissionsPage
