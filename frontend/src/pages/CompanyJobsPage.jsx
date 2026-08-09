import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, DashboardPage, EmptyState } from '../components/ui'
import { fetchJobForms, fetchJobs, fetchSubmissions } from '../services/companyApi'

function CompanyJobsPage() {
  const [jobs, setJobs] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    fetchJobs()
      .then(async (rows) => {
        if (!active) return
        setJobs(rows)
        const nextMeta = {}
        await Promise.all(
          rows.map(async (job) => {
            const forms = await fetchJobForms(job.id)
            const submissions = (
              await Promise.all(forms.map((form) => fetchSubmissions(form.id)))
            ).flat()
            nextMeta[job.id] = {
              liveForms: forms.filter((f) => f.isPublished).length,
              submissions: submissions.length
            }
          })
        )
        if (active) setMeta(nextMeta)
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
    <DashboardPage
      eyebrow="Hiring"
      title="Jobs & forms"
      description="Every role in this workspace, with its live application links."
      actions={
        <Button as={Link} to="/dashboard/jobs/new" variant="primary">
          Create job
        </Button>
      }
    >
      {loading ? (
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Loading jobs…</p>
      ) : null}
      {error ? <p className="alert alert-error">{error}</p> : null}

      {!loading && jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          description="Create a job posting, attach an application form, then share the link with candidates."
          action={
            <Button as={Link} to="/dashboard/jobs/new" variant="primary">
              Create your first job
            </Button>
          }
        />
      ) : null}

      {!loading && jobs.length > 0 ? (
        <ul className="panel animate-rise divide-y divide-ink/8">
          {jobs.map((job) => {
            const jobMeta = meta[job.id] || { liveForms: 0, submissions: 0 }
            return (
              <li key={job.id} className="p-5 transition hover:bg-paper/60 md:p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between md:gap-8">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge tone={job.status === 'open' ? 'ok' : 'neutral'}>{job.status}</Badge>
                      <span className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-faint">
                        {job.team} · {job.location}
                      </span>
                    </div>

                    <h2 className="mt-3 font-display text-xl font-bold tracking-[-0.02em]">
                      <Link to={`/dashboard/jobs/${job.id}`} className="text-ink hover:text-signal">
                        {job.title}
                      </Link>
                    </h2>

                    <p className="mt-2 line-clamp-2 max-w-[70ch] text-sm leading-6 text-muted">
                      {job.description}
                    </p>

                    {job.mustHave?.length ? (
                      <p className="mt-3 text-sm text-faint">
                        {job.mustHave.slice(0, 6).join(' · ')}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
                    <p className="readout text-xs text-muted">
                      {jobMeta.liveForms} live · {jobMeta.submissions} applied
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        as={Link}
                        to={`/dashboard/jobs/${job.id}/forms/new`}
                        variant="ghost"
                      >
                        Add form
                      </Button>
                      <Button as={Link} to={`/dashboard/jobs/${job.id}`} variant="secondary">
                        Manage
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </DashboardPage>
  )
}

export default CompanyJobsPage
