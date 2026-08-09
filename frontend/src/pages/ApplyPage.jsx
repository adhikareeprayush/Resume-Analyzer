import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Button,
  EmptyState,
  Field,
  FileInput,
  SelectInput,
  StepIndicator,
  TextArea,
  TextInput,
  Wordmark
} from '../components/ui'
import { useAuthOptional } from '../context/AuthContext'
import { fetchPublicForm, submitApplication } from '../services/companyApi'

function DynamicField({ field, value, onChange }) {
  if (field.type === 'checkbox') {
    return (
      <label className="flex cursor-pointer items-start gap-3 rounded-[0.625rem] border border-ink/12 bg-surface px-4 py-3.5 transition hover:border-ink/25">
        <input
          type="checkbox"
          className="mt-1 accent-signal"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          required={field.required}
        />
        <span className="text-sm leading-6 text-ink">
          {field.label}
          {field.required ? <span className="text-signal"> *</span> : null}
        </span>
      </label>
    )
  }

  return (
    <Field label={field.label} required={field.required}>
      {field.type === 'textarea' ? (
        <TextArea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      ) : field.type === 'select' ? (
        <SelectInput
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        >
          <option value="">Select…</option>
          {(field.options || []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </SelectInput>
      ) : field.type === 'file' ? (
        <FileInput
          accept={field.accept || '.pdf,.docx,.txt'}
          onChange={(e) => onChange(e.target.files?.[0] || null)}
          required={field.required}
        />
      ) : (
        <TextInput
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
        />
      )}
    </Field>
  )
}

function ApplyShell({ children }) {
  return (
    <div className="canvas-light app-shell flex min-h-screen w-full items-center justify-center px-5 py-16">
      <div className="w-full max-w-xl">{children}</div>
    </div>
  )
}

function ApplyPage() {
  const { slug } = useParams()
  const auth = useAuthOptional()
  const [form, setForm] = useState(null)
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submissionId, setSubmissionId] = useState('')
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [prefilled, setPrefilled] = useState(false)

  useEffect(() => {
    let active = true
    fetchPublicForm(slug)
      .then((data) => {
        if (!active) return
        setForm(data.form)
        setJob(data.job)
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
  }, [slug])

  useEffect(() => {
    if (!form || prefilled || !auth?.isCandidate || !auth.user) return
    setAnswers((prev) => {
      const next = { ...prev }
      const nameField = form.fields.find((f) => f.type === 'text' && /name/i.test(f.label))
      const emailField = form.fields.find((f) => f.type === 'email')
      if (nameField && !next[nameField.id]) next[nameField.id] = auth.user.name
      if (emailField && !next[emailField.id]) next[emailField.id] = auth.user.email
      return next
    })
    setPrefilled(true)
  }, [form, auth?.isCandidate, auth?.user, prefilled])

  if (loading) {
    return (
      <ApplyShell>
        <p className="text-center font-mono text-xs uppercase tracking-[0.16em] text-muted">
          Loading application…
        </p>
      </ApplyShell>
    )
  }

  if (error || !form || !job) {
    return (
      <ApplyShell>
        <EmptyState
          title="Application not found"
          description="This link may be unpublished or incorrect. Ask the hiring team for an updated URL."
          action={
            <Button as={Link} to="/" variant="secondary">
              Go home
            </Button>
          }
        />
      </ApplyShell>
    )
  }

  const totalSteps = Math.max(1, Math.ceil(form.fields.length / 4))
  const fieldsPerStep = Math.ceil(form.fields.length / totalSteps)
  const visibleFields = form.fields.slice(step * fieldsPerStep, (step + 1) * fieldsPerStep)

  const setAnswer = (id, value) => setAnswers((c) => ({ ...c, [id]: value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (step < totalSteps - 1) {
      setStep((s) => s + 1)
      return
    }

    const nameField = form.fields.find((f) => f.type === 'text' && /name/i.test(f.label))
    const emailField = form.fields.find((f) => f.type === 'email')

    setSubmitting(true)
    try {
      const result = await submitApplication(slug, {
        candidateName: nameField ? answers[nameField.id] : auth?.user?.name || 'Candidate',
        email: emailField ? answers[emailField.id] : auth?.user?.email || 'unknown@email.com',
        answers
      })
      setSubmissionId(result.id || '')
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <ApplyShell>
        <div className="text-center">
          <p className="eyebrow">Application received</p>
          <h1 className="display-title mt-4 text-[2rem] text-ink">You're all set.</h1>
          <p className="mx-auto mt-4 max-w-[42ch] text-sm leading-7 text-muted">
            Thanks for applying to {job.title}. The hiring team has your application
            {submissionId ? ` (${submissionId})` : ''}.
          </p>
          {auth?.isCandidate ? (
            <Button as={Link} to="/candidate" variant="primary" className="mt-8">
              Track in my applications
            </Button>
          ) : (
            <div className="mt-8 grid gap-3">
              <p className="text-sm text-muted">
                Create a free candidate account with the same email to track status later.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button as={Link} to="/candidate/signup" variant="primary">
                  Create candidate account
                </Button>
                <Button as={Link} to="/login" variant="secondary">
                  Sign in
                </Button>
              </div>
            </div>
          )}
        </div>
      </ApplyShell>
    )
  }

  return (
    <div className="app-shell flex min-h-screen w-full flex-col lg:flex-row">
      <aside className="plane-dark relative flex flex-col gap-8 px-5 py-10 text-paper sm:px-8 lg:w-[40%] lg:justify-between lg:px-12 lg:py-12 xl:px-16">
        <Wordmark onDark />

        <div className="lg:pb-4">
          <p className="eyebrow-on-dark">Now hiring</p>
          <h1 className="display-title mt-4 text-[clamp(1.75rem,4vw,2.75rem)] text-paper">
            {job.title}
          </h1>
          <p className="readout mt-4 text-sm text-paper/50">{job.location}</p>

          <p className="mt-8 max-w-[52ch] text-sm leading-7 text-paper/70">{job.description}</p>

          {job.mustHave?.length ? (
            <div className="mt-8 border-t border-white/12 pt-6">
              <p className="eyebrow-on-dark">Must have</p>
              <ul className="mt-4 grid gap-2 text-sm text-paper/70 sm:grid-cols-2">
                {job.mustHave.map((skill) => (
                  <li key={skill} className="flex items-baseline gap-2.5">
                    <span className="text-signal-hot" aria-hidden="true">
                      —
                    </span>
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <p className="hidden font-mono text-[0.7rem] uppercase tracking-[0.16em] text-paper/30 lg:block">
          Ranked with TalentLens
        </p>
      </aside>

      <div className="canvas-light flex flex-1 items-start justify-center px-5 py-12 sm:px-8 lg:items-center lg:px-12 lg:py-16">
        <div className="w-full max-w-xl">
          <div className="panel p-5 shadow-soft sm:p-7">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="font-display text-lg font-bold tracking-[-0.02em] text-ink">
                {form.title}
              </h2>
              <p className="readout shrink-0 text-xs text-muted">
                {step + 1}/{totalSteps}
              </p>
            </div>

            {totalSteps > 1 ? (
              <div className="mt-4">
                <StepIndicator total={totalSteps} current={step} />
              </div>
            ) : null}

            {error ? (
              <p className="alert alert-error mt-5">{error}</p>
            ) : null}

            <form onSubmit={handleSubmit} className="mt-7 grid gap-5">
              {visibleFields.map((field) => (
                <DynamicField
                  key={field.id}
                  field={field}
                  value={answers[field.id]}
                  onChange={(v) => setAnswer(field.id, v)}
                />
              ))}

              <div className="mt-2 flex gap-3 border-t border-ink/10 pt-5">
                {step > 0 ? (
                  <Button type="button" variant="secondary" onClick={() => setStep((s) => s - 1)}>
                    Back
                  </Button>
                ) : null}
                <Button type="submit" variant="primary" className="flex-1" disabled={submitting}>
                  {submitting
                    ? 'Submitting…'
                    : step < totalSteps - 1
                      ? 'Continue'
                      : 'Submit application'}
                </Button>
              </div>
            </form>
          </div>

          <p className="mt-5 text-center text-xs leading-6 text-faint">
            Your answers go directly to the hiring team.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ApplyPage
