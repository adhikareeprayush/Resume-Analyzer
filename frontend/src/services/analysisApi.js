import { apiFetch } from './api'

export function buildAnalysisFormData({ jobTitle, jobDescription, files }) {
  const formData = new FormData()
  formData.append('jobTitle', jobTitle || '')
  formData.append('jobDescription', jobDescription || '')
  for (const file of files || []) {
    formData.append('resumeFile', file)
  }
  return formData
}

export async function requestBackendAnalysis(payload) {
  return apiFetch('/api/analyze', {
    method: 'POST',
    body: buildAnalysisFormData(payload)
  })
}

export async function fetchBackendHistory() {
  return apiFetch('/api/analysis-history')
}

export async function fetchAnalysisDetail(analysisId) {
  return apiFetch(`/api/analysis/${analysisId}`)
}

export async function fetchHealth() {
  return apiFetch('/api/health')
}
