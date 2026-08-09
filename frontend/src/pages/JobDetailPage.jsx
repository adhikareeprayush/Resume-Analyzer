import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Alert, Badge, Button, CopyButton, DashboardPage, EmptyState } from '../components/ui'
import { buildFormLink, fetchJob, fetchJobForms, fetchSubmissions } from '../services/companyApi'

function JobDetailPage() {
  const { jobId } = useParams()
  const location = useLocation()
  const [job, setJob] = useState(null)
  const [forms, setForms] = useState([])
  const [submissionCounts, setSubmissionCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState(location.state?.notice || '')

  useEffect(() => {
    let active = true

    Promise.all([fetchJob(jobId), fetchJobForms(jobId)])
      .then(async ([jobData, formRows]) => {
        if (!active) return
        setJob(jobData)
        setForms(formRows)
        const counts = {}
        await Promise.all(
          formRows.map(async (form) => {
            const subs = await fetchSubmissions(form.id)
            counts[form.id] = subs.length
          })
        )
        if (active) setSubmissionCounts(counts)
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
  }, [jobId])

  if (loading) {
    return (
      <DashboardPage title="Loading…">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">
          Loading job details…
        </p>
      </DashboardPage>
    )
  }

  if (error || !job) {
    return (
      <DashboardPage
        title="Job not found"
        breadcrumbs={[{ label: 'Jobs', to: '/dashboard/jobs' }, { label: 'Not found' }]}
      >
        <EmptyState
          title="Job not found"
          description={error || 'This role may have been removed.'}
          action={
            <Button as={Link} to="/dashboard/jobs" variant="primary">
              Back to jobs
            </Button>
          }
        />
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      eyebrow={`${job.team} · ${job.location}`}
      title={job.title}
      description={
        <span className="inline-flex items-center gap-2">
          <Badge tone={job.status === 'open' ? 'ok' : 'neutral'}>
            {job.status === 'open' ? 'Open' : job.status || 'Open'}
          </Badge>
        </span>
      }
      breadcrumbs={[{ label: 'Jobs', to: '/dashboard/jobs' }, { label: job.title }]}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button as={Link} to={`/dashboard/jobs/${job.id}/edit`} variant="secondary">
            Edit job
          </Button>
          <Button as={Link} to={`/dashboard/jobs/${job.id}/forms/new`} variant="primary">
            Create form
          </Button>
        </div>
      }
    >
      {notice ? (
        <Alert tone="success" onDismiss={() => setNotice('')}>
          {notice}
        </Alert>
      ) : null}

      <section className="animate-rise grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="eyebrow">Role description</p>
          <p className="mt-4 max-w-[68ch] text-sm leading-7 text-muted">{job.description}</p>
        </div>
        <div>
          <p className="eyebrow">Must have</p>
          {job.mustHave?.length ? (
            <ul className="mt-4 grid gap-2 text-sm text-ink">
              {job.mustHave.map((skill) => (
                <li key={skill} className="flex items-baseline gap-2.5 border-b border-ink/8 pb-2">
                  <span className="text-signal" aria-hidden="true">
                    —
                  </span>
                  {skill}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted">No must-have skills listed.</p>
          )}
        </div>
      </section>

      <section className="animate-rise">
        <div className="flex items-end justify-between gap-4 border-b border-ink/10 pb-4">
          <div>
            <p className="eyebrow">Application forms</p>
            <h2 className="mt-2 font-display text-xl font-bold tracking-[-0.02em] text-ink">
              Links candidates use
            </h2>
          </div>
          <p className="readout shrink-0 text-xs text-muted">{forms.length} total</p>
        </div>

        {forms.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No forms yet"
              description="Build a form to collect applications and get a shareable public URL."
              action={
                <Button as={Link} to={`/dashboard/jobs/${job.id}/forms/new`} variant="primary">
                  Build form
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="mt-6 grid gap-4">
            {forms.map((form) => {
              const count = submissionCounts[form.id] || 0
              const link = buildFormLink(form.slug)
              return (
                <li key={form.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="font-display text-base font-bold tracking-[-0.02em] text-ink">
                        {form.title}
                      </h3>
                      <p className="readout mt-1.5 text-xs text-muted">
                        {form.fields?.length || 0} fields ·{' '}
                        <Link
                          to={`/dashboard/jobs/${job.id}/forms/${form.id}/submissions`}
                          className="text-signal transition hover:text-ink"
                        >
                          {count} submissions
                        </Link>
                      </p>
                    </div>
                    <Badge tone={form.isPublished ? 'ok' : 'neutral'}>
                      {form.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>

                  {form.isPublished ? (
                    <div className="mt-4 rounded-[0.625rem] border border-ink/10 bg-paper px-4 py-3.5">
                      <p className="eyebrow">Public link</p>
                      <p className="readout mt-2 break-all text-sm text-ink">{link}</p>
                      <div className="mt-3.5 flex flex-wrap gap-2">
                        <CopyButton text={link} />
                        <Button as="a" href={link} target="_blank" rel="noreferrer" variant="ghost">
                          Preview
                        </Button>
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      as={Link}
                      to={`/dashboard/jobs/${job.id}/forms/${form.id}/submissions`}
                      variant="primary"
                    >
                      View & rank{count ? ` (${count})` : ''}
                    </Button>
                    <Button
                      as={Link}
                      to={`/dashboard/jobs/${job.id}/forms/${form.id}/edit`}
                      variant="secondary"
                    >
                      Edit form
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </DashboardPage>
  )
}

export default JobDetailPage
