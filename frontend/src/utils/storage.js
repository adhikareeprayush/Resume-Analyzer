const DRAFT_KEY = 'talentlens-analyze-draft-v1'
const HISTORY_KEY = 'talentlens-analysis-history-v1'
const TOUR_KEY = 'talentlens-tour-seen-v1'

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage errors in private mode/quota issues.
  }
}

export function loadDraft() {
  if (typeof window === 'undefined') return null
  return readJson(DRAFT_KEY, null)
}

export function saveDraft(draft) {
  if (typeof window === 'undefined') return
  writeJson(DRAFT_KEY, draft)
}

export function loadAnalysisHistory() {
  if (typeof window === 'undefined') return []
  return readJson(HISTORY_KEY, [])
}

export function saveAnalysisHistory(entry) {
  if (typeof window === 'undefined') return []
  const current = loadAnalysisHistory()
  const next = [entry, ...current].slice(0, 5)
  writeJson(HISTORY_KEY, next)
  return next
}

export function hasSeenTour() {
  if (typeof window === 'undefined') return true

  const raw = window.localStorage.getItem(TOUR_KEY)
  if (!raw) return false
  if (raw === 'true') return true

  const parsed = readJson(TOUR_KEY, null)
  return Boolean(parsed?.seen)
}

export function markTourSeen() {
  if (typeof window === 'undefined') return
  writeJson(TOUR_KEY, { seen: true, seenAt: new Date().toISOString() })
}
