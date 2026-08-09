import { apiFetch, getApiBase, getToken } from './api'

export async function login(email, password) {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })
}

export async function registerWorkspace(payload) {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function registerCandidate(payload) {
  return apiFetch('/api/auth/register-candidate', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function fetchMe() {
  return apiFetch('/api/auth/me')
}

export async function fetchCandidateApplications() {
  const data = await apiFetch('/api/candidate/applications')
  return data.applications || []
}

export async function fetchCandidateSuggestions() {
  return apiFetch('/api/candidate/suggestions')
}

export async function fetchCandidateProfile() {
  return apiFetch('/api/candidate/profile')
}

export async function updateCandidateProfile(payload) {
  return apiFetch('/api/candidate/profile', {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function fetchCompany() {
  return apiFetch('/api/company')
}

export async function updateCompany(payload) {
  return apiFetch('/api/company', {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function fetchDashboardOverview() {
  return apiFetch('/api/dashboard/overview')
}

export async function fetchJobs() {
  const data = await apiFetch('/api/jobs')
  return data.jobs || []
}

export async function fetchJob(jobId) {
  return apiFetch(`/api/jobs/${jobId}`)
}

export async function createJob(job) {
  return apiFetch('/api/jobs', {
    method: 'POST',
    body: JSON.stringify(job)
  })
}

export async function updateJob(jobId, patch) {
  return apiFetch(`/api/jobs/${jobId}`, {
    method: 'PUT',
    body: JSON.stringify(patch)
  })
}

export async function deleteJob(jobId) {
  return apiFetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
}

export async function fetchJobForms(jobId) {
  const data = await apiFetch(`/api/jobs/${jobId}/forms`)
  return data.forms || []
}

export async function fetchForm(formId) {
  return apiFetch(`/api/forms/${formId}`)
}

export async function createForm(form) {
  return apiFetch('/api/forms', {
    method: 'POST',
    body: JSON.stringify(form)
  })
}

export async function updateForm(formId, form) {
  return apiFetch(`/api/forms/${formId}`, {
    method: 'PUT',
    body: JSON.stringify(form)
  })
}

export async function fetchPublicForm(slug) {
  return apiFetch(`/api/forms/public/${slug}`)
}

export async function submitApplication(slug, payload) {
  const formData = new FormData()
  formData.append('candidateName', payload.candidateName || 'Candidate')
  formData.append('email', payload.email || 'unknown@email.com')

  const answers = {}
  const files = { ...(payload.files || {}) }

  Object.entries(payload.answers || {}).forEach(([fieldId, value]) => {
    if (value instanceof File) {
      files[fieldId] = value
      answers[fieldId] = value.name
    } else {
      answers[fieldId] = value
    }
  })

  formData.append('answers', JSON.stringify(answers))
  Object.entries(files).forEach(([fieldId, file]) => {
    if (file instanceof File) {
      formData.append(`file_${fieldId}`, file, file.name)
    }
  })

  return apiFetch(`/api/forms/public/${slug}/submit`, {
    method: 'POST',
    body: formData
  })
}

export async function fetchFormAnalysis(formId) {
  const data = await apiFetch(`/api/forms/${formId}/analysis`)
  return data.analysis || null
}

export async function analyzeFormSubmissions(formId) {
  return apiFetch(`/api/forms/${formId}/analyze`, { method: 'POST' })
}

export async function deleteForm(formId) {
  return apiFetch(`/api/forms/${formId}`, { method: 'DELETE' })
}

export async function fetchSubmissions(formId) {
  const query = formId ? `?formId=${encodeURIComponent(formId)}` : ''
  const data = await apiFetch(`/api/submissions${query}`)
  return data.submissions || []
}

export async function updateSubmission(submissionId, patch) {
  return apiFetch(`/api/submissions/${submissionId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch)
  })
}

export function buildResumeDownloadUrl(submissionId) {
  const base = getApiBase()
  return `${base}/api/submissions/${submissionId}/resume`
}

export async function downloadSubmissionResume(submissionId, filename) {
  const token = getToken()
  const response = await fetch(buildResumeDownloadUrl(submissionId), {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'Could not download resume')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename || 'resume'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function buildFormLink(slug) {
  if (typeof window === 'undefined') return `/apply/${slug}`
  return `${window.location.origin}/apply/${slug}`
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
