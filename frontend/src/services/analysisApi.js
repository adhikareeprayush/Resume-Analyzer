export function buildAnalysisFormData({ jobTitle, jobDescription, files }) {
  const formData = new FormData()
  formData.append('jobTitle', jobTitle)
  formData.append('jobDescription', jobDescription)
  formData.append('resumeText', jobDescription)

  files.forEach((file) => {
    formData.append('resumeFile', file)
  })

  return formData
}

function buildApiUrl(path) {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
  return `${baseUrl}${path}`
}

export async function requestBackendAnalysis(payload) {
  const response = await fetch(buildApiUrl('/api/analyze'), {
    method: 'POST',
    body: buildAnalysisFormData(payload)
  })

  if (!response.ok) {
    let detail = `Backend request failed with status ${response.status}`
    try {
      const body = await response.json()
      if (body?.error) {
        detail = body.error
      }
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(detail)
  }

  const contentType = response.headers.get('content-type') || ''

  if (!contentType.includes('application/json')) {
    throw new Error('Backend response is not JSON yet. Keep using mock mode for now.')
  }

  return response.json()
}

export async function fetchBackendHistory() {
  const response = await fetch(buildApiUrl('/api/analysis-history'))

  if (!response.ok) {
    throw new Error(`Backend history request failed with status ${response.status}`)
  }

  return response.json()
}
