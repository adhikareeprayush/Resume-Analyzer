import {
  DEFAULT_FORMS,
  DEFAULT_JOBS,
  DEFAULT_SUBMISSIONS,
  DEMO_COMPANY,
  DEMO_USER
} from '../data/companyMockData'

const KEYS = {
  jobs: 'talentlens-jobs-v1',
  forms: 'talentlens-forms-v1',
  submissions: 'talentlens-submissions-v1',
  session: 'talentlens-session-v1',
  seeded: 'talentlens-seeded-v1'
}

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota / private mode
  }
}

export function seedMockWorkspace() {
  if (typeof window === 'undefined') return
  if (window.localStorage.getItem(KEYS.seeded)) return

  write(KEYS.jobs, DEFAULT_JOBS)
  write(KEYS.forms, DEFAULT_FORMS)
  write(KEYS.submissions, DEFAULT_SUBMISSIONS)
  window.localStorage.setItem(KEYS.seeded, 'true')
}

export function getJobs(companyId) {
  return read(KEYS.jobs, []).filter((job) => job.companyId === companyId)
}

export function getJob(jobId) {
  return read(KEYS.jobs, []).find((job) => job.id === jobId) ?? null
}

export function saveJob(job) {
  const jobs = read(KEYS.jobs, [])
  const index = jobs.findIndex((item) => item.id === job.id)
  const next = [...jobs]
  if (index === -1) next.unshift(job)
  else next[index] = job
  write(KEYS.jobs, next)
  return job
}

export function deleteJob(jobId) {
  write(
    KEYS.jobs,
    read(KEYS.jobs, []).filter((job) => job.id !== jobId)
  )
  write(
    KEYS.forms,
    read(KEYS.forms, []).filter((form) => form.jobId !== jobId)
  )
  write(
    KEYS.submissions,
    read(KEYS.submissions, []).filter((submission) => submission.jobId !== jobId)
  )
}

export function getForms(companyId) {
  return read(KEYS.forms, []).filter((form) => form.companyId === companyId)
}

export function getFormsByJob(jobId) {
  return read(KEYS.forms, []).filter((form) => form.jobId === jobId)
}

export function getForm(formId) {
  return read(KEYS.forms, []).find((form) => form.id === formId) ?? null
}

export function getFormBySlug(slug) {
  return read(KEYS.forms, []).find((form) => form.slug === slug && form.isPublished) ?? null
}

export function saveForm(form) {
  const forms = read(KEYS.forms, [])
  const index = forms.findIndex((item) => item.id === form.id)
  const next = [...forms]
  if (index === -1) next.unshift(form)
  else next[index] = form
  write(KEYS.forms, next)
  return form
}

export function getSubmissions(companyId) {
  return read(KEYS.submissions, []).filter((item) => item.companyId === companyId)
}

export function getSubmissionsByForm(formId) {
  return read(KEYS.submissions, []).filter((item) => item.formId === formId)
}

export function saveSubmission(submission) {
  const submissions = read(KEYS.submissions, [])
  write(KEYS.submissions, [submission, ...submissions])
  return submission
}

export function getSession() {
  return read(KEYS.session, null)
}

export function saveSession(session) {
  write(KEYS.session, session)
}

export function clearSession() {
  window.localStorage.removeItem(KEYS.session)
}

export function loginWithCredentials(email, password) {
  if (email === DEMO_USER.email && password === DEMO_USER.password) {
    const session = {
      user: {
        id: DEMO_USER.id,
        name: DEMO_USER.name,
        email: DEMO_USER.email,
        role: DEMO_USER.role,
        companyId: DEMO_USER.companyId
      },
      company: DEMO_COMPANY,
      loggedInAt: new Date().toISOString()
    }
    saveSession(session)
    return session
  }
  return null
}

export function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48)
}

export function createId(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function buildFormLink(slug) {
  if (typeof window === 'undefined') return `/apply/${slug}`
  return `${window.location.origin}/apply/${slug}`
}
