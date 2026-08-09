import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import FormBuilderEditor from '../components/formBuilder/FormBuilderEditor'
import { Alert, Button, Card, DashboardPage, Field, TextInput } from '../components/ui'
import {
  DEFAULT_APPLICATION_FIELDS,
  appFieldsToFjormData,
  fjormDataToAppFields
} from '../utils/formSchema'
import {
  buildFormLink,
  createForm,
  fetchForm,
  fetchJob,
  slugify,
  updateForm
} from '../services/companyApi'

function FormBuilderPage() {
  const { jobId, formId } = useParams()
  const isEdit = Boolean(formId)
  const navigate = useNavigate()
  const builderRef = useRef(null)

  const [job, setJob] = useState(null)
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [notice, setNotice] = useState('')
  const [fieldCount, setFieldCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [initialFjormData, setInitialFjormData] = useState([])

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const jobData = await fetchJob(jobId)
        if (!active) return
        setJob(jobData)

        if (isEdit) {
          const form = await fetchForm(formId)
          if (!active) return
          setTitle(form.title)
          setSlug(form.slug)
          setFieldCount(form.fields?.length || 0)
          setInitialFjormData(
            form.fjormData?.length ? form.fjormData : appFieldsToFjormData(form.fields || [])
          )
        } else {
          setInitialFjormData(appFieldsToFjormData(DEFAULT_APPLICATION_FIELDS))
          setFieldCount(DEFAULT_APPLICATION_FIELDS.length)
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
  }, [jobId, formId, isEdit])

  const handleStructureChange = (structure) => {
    setFieldCount(fjormDataToAppFields(structure).length)
  }

  const persistForm = async (publish) => {
    const fjormData = builderRef.current?.getFormItems?.() || []
    const fields = fjormDataToAppFields(fjormData)
    const nextSlug = slug.trim() || slugify(title)

    if (fields.length === 0) {
      setNotice('Add at least one field before saving.')
      return
    }

    const payload = {
      jobId: job.id,
      title: title.trim() || `${job.title} Application`,
      slug: nextSlug,
      isPublished: Boolean(publish),
      fields,
      fjormData
    }

    try {
      if (isEdit) {
        await updateForm(formId, payload)
      } else {
        await createForm(payload)
      }
      navigate(`/dashboard/jobs/${job.id}`, {
        state: { notice: publish ? 'Form published successfully.' : 'Draft saved.' }
      })
    } catch (err) {
      setNotice(err.message)
    }
  }

  const copyLink = async () => {
    const nextSlug = slug.trim() || slugify(title)
    await navigator.clipboard.writeText(buildFormLink(nextSlug))
    setNotice('Link copied to clipboard.')
    window.setTimeout(() => setNotice(''), 2500)
  }

  if (loading) {
    return (
      <DashboardPage title="Form builder">
        <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Loading…</p>
      </DashboardPage>
    )
  }

  if (error || !job) {
    return (
      <DashboardPage title="Job not found">
        <Card title="Job not found">
          <p className="mb-4 text-sm text-muted">{error}</p>
          <Button as={Link} to="/dashboard/jobs" variant="secondary">
            Back
          </Button>
        </Card>
      </DashboardPage>
    )
  }

  return (
    <DashboardPage
      wide
      eyebrow="Form builder"
      title={isEdit ? 'Edit application form' : 'New application form'}
      description={`${job.title} · ${fieldCount} field${fieldCount === 1 ? '' : 's'}`}
      breadcrumbs={[
        { label: 'Jobs', to: '/dashboard/jobs' },
        { label: job.title, to: `/dashboard/jobs/${job.id}` },
        { label: isEdit ? 'Edit form' : 'New form' }
      ]}
      actions={
        <div className="flex flex-wrap gap-2">
          {isEdit ? (
            <Button
              as={Link}
              to={`/dashboard/jobs/${job.id}/forms/${formId}/submissions`}
              variant="ghost"
            >
              Applications & ranking
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => persistForm(false)}>
            Save draft
          </Button>
          <Button variant="primary" onClick={() => persistForm(true)}>
            Publish
          </Button>
          <Button variant="ghost" onClick={copyLink}>
            Copy link
          </Button>
        </div>
      }
    >
      {notice ? (
        <Alert
          tone={notice.includes('Add at least') ? 'warning' : 'success'}
          onDismiss={() => setNotice('')}
        >
          {notice}
        </Alert>
      ) : null}

      <Card padding="sm" className="overflow-hidden">
        <div className="mb-6 grid gap-5 border-b border-ink/10 pb-6 md:grid-cols-2">
          <Field label="Form title">
            <TextInput
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (!isEdit && !slug) setSlug(slugify(e.target.value))
              }}
              placeholder={`${job.title} Application`}
            />
          </Field>
          <Field label="Public URL slug" hint={buildFormLink(slug || 'your-slug')}>
            <TextInput value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </Field>
        </div>

        <p className="mb-4 max-w-[70ch] text-sm leading-6 text-muted">
          Drag fields from the palette onto the canvas. Select a field to edit its label,
          placeholder, and options in the sidebar.
        </p>

        <FormBuilderEditor
          key={isEdit ? formId : 'new'}
          builderRef={builderRef}
          initialData={initialFjormData}
          onStructureChange={handleStructureChange}
        />
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button as={Link} to={`/dashboard/jobs/${job.id}`} variant="ghost">
          ← Back to job
        </Button>
      </div>
    </DashboardPage>
  )
}

export default FormBuilderPage
