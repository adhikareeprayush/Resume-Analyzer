import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Alert, Button, Card, DashboardPage, Field, TextArea, TextInput } from '../components/ui'
import { createJob, fetchJob, updateJob } from '../services/companyApi'

function JobEditorPage() {
  const { jobId } = useParams()
  const isEdit = Boolean(jobId)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [team, setTeam] = useState('')
  const [location, setLocation] = useState('Remote')
  const [status, setStatus] = useState('open')
  const [description, setDescription] = useState('')
  const [mustHave, setMustHave] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return undefined
    let active = true
    fetchJob(jobId)
      .then((job) => {
        if (!active) return
        setTitle(job.title || '')
        setTeam(job.team || '')
        setLocation(job.location || 'Remote')
        setStatus(job.status || 'open')
        setDescription(job.description || '')
        setMustHave((job.mustHave || []).join(', '))
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
  }, [isEdit, jobId])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = {
      title: title.trim(),
      team: team.trim() || 'General',
      location: location.trim(),
      status,
      description: description.trim(),
      mustHave: mustHave
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    }

    try {
      const job = isEdit ? await updateJob(jobId, payload) : await createJob({ ...payload, status: 'open' })
      navigate(`/dashboard/jobs/${job.id}`, {
        state: { notice: isEdit ? 'Job updated.' : 'Job created.' }
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardPage title="Edit job">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Loading job…</p>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      eyebrow={isEdit ? 'Edit role' : 'New role'}
      title={isEdit ? 'Edit job posting' : 'Create a job posting'}
      description="This becomes the context for application forms and resume analysis."
      breadcrumbs={[
        { label: 'Jobs', to: '/dashboard/jobs' },
        ...(isEdit
          ? [
              { label: title || 'Job', to: `/dashboard/jobs/${jobId}` },
              { label: 'Edit' }
            ]
          : [{ label: 'New job' }])
      ]}
    >
      <Card padding="none" className="overflow-hidden">
        <form className="grid gap-6 p-5 md:p-7" onSubmit={handleSubmit}>
          {error ? <Alert tone="error">{error}</Alert> : null}
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Job title" required>
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Senior Product Designer"
                required
              />
            </Field>
            <Field label="Team">
              <TextInput value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Product" />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Location">
              <TextInput value={location} onChange={(e) => setLocation(e.target.value)} />
            </Field>
            {isEdit ? (
              <Field label="Status">
                <select
                  className="field-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </Field>
            ) : null}
          </div>

          <Field label="Description" required>
            <TextArea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </Field>

          <Field label="Must-have skills" hint="Comma-separated — used when ranking applicants">
            <TextInput
              value={mustHave}
              onChange={(e) => setMustHave(e.target.value)}
              placeholder="React, TypeScript, Figma"
            />
          </Field>

          <div className="flex flex-wrap gap-3 border-t border-ink/10 pt-5">
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create job'}
            </Button>
            <Button
              as={Link}
              to={isEdit ? `/dashboard/jobs/${jobId}` : '/dashboard/jobs'}
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </DashboardPage>
  )
}

export default JobEditorPage
