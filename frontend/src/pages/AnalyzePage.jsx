import { Joyride, STATUS } from 'react-joyride'
import { Link, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { fetchBackendHistory, requestBackendAnalysis } from '../services/analysisApi'
import {
  hasSeenTour,
  loadAnalysisHistory,
  loadDraft,
  markTourSeen,
  saveDraft
} from '../utils/storage'

import AnalyzeCard, { AnalyzeStatCard } from '../components/AnalyzeCard'

const AnalysisCharts = lazy(() => import('../components/AnalysisCharts'))
const MAX_RESUMES = Number(import.meta.env.VITE_MAX_RESUMES) || 150

const tourSteps = [
  {
    target: '.tour-request-form',
    title: 'Create Request',
    content: 'Fill role details and paste the job description so ranking context is clear.',
    skipBeacon: true
  },
  {
    target: '.tour-upload-field',
    title: 'Upload CV Files',
    content: 'Upload PDF, DOCX, or TXT resumes. Files are sent as multipart form-data to backend.',
    skipBeacon: true
  },
  {
    target: '.tour-submit-action',
    title: 'Run Analysis',
    content: 'Run in mock mode for now, or enable backend mode when JSON endpoint is ready.',
    skipBeacon: true
  },
  {
    target: '.tour-chart-panel',
    title: 'Read Analytics',
    content: 'Review score distribution, model fit mix, shortlist bars, and skill-coverage charts.',
    skipBeacon: true
  }
]

function AnalyzePage() {
  const navigate = useNavigate()
  const draft = loadDraft()

  const [jobTitle, setJobTitle] = useState(draft?.jobTitle || 'Machine Learning Engineer')
  const [jobDescription, setJobDescription] = useState(
    draft?.jobDescription ||
      'We need a machine learning engineer with Python, model evaluation, Flask APIs, and NLP exposure.'
  )
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Ready to analyze resumes.')
  const [recentHistory, setRecentHistory] = useState([])
  const [runTour, setRunTour] = useState(false)
  const [analysisState, setAnalysisState] = useState(null)

  const topThree = useMemo(() => analysisState?.rankedResumes?.slice(0, 3) ?? [], [analysisState])
  const matchedKeywords = analysisState?.matchedKeywords ?? []
  const missingKeywords = analysisState?.missingKeywords ?? []

  useEffect(() => {
    saveDraft({ jobTitle, jobDescription })
  }, [jobTitle, jobDescription])

  useEffect(() => {
    let active = true

    fetchBackendHistory()
      .then((payload) => {
        if (!active) return
        setRecentHistory(payload.history || [])
      })
      .catch(() => {
        if (!active) return
        setRecentHistory(loadAnalysisHistory())
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (hasSeenTour()) return undefined

    const timer = window.setTimeout(() => {
      setRunTour(true)
    }, 250)

    return () => window.clearTimeout(timer)
  }, [])

  const handleTourEvent = (data) => {
    const { status, type } = data
    const tourEnded =
      type === 'tour:end' || status === STATUS.FINISHED || status === STATUS.SKIPPED

    if (tourEnded) {
      markTourSeen()
      setRunTour(false)
    }
  }

  const submitMockAnalysis = (files) => {
    setStatusMessage('Backend was unavailable, so the UI fell back to local preview mode.')
    setAnalysisState({
      keywords: [],
      matchedKeywords: [],
      missingKeywords: [],
      summary: {
        totalResumes: files.length,
        avgScore: 0,
        topScore: 0,
        keywordInsights: {
          totalKeywords: 0,
          matchedKeywordsCount: 0,
          missingKeywordsCount: 0,
          coverageRate: 0
        },
        distribution: { high: 0, medium: 0, low: files.length }
      },
      rankedResumes: files.map((file, index) => ({
        id: `${file.name}-${index}`,
        resumeName: file.name,
        score: 0,
        confidence: 0,
        skillsMatched: 0,
        gapRisk: 100,
        keywordCoverage: 0,
        matchedKeywords: [],
        missingKeywords: [],
        explanation: 'Preview only. Connect the backend to see live ranking results.',
        recommendation: 'Preview only. Connect the backend to see live ranking results.'
      }))
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const files = Array.from(uploadedFiles)

    if (files.length === 0) {
      setStatusMessage('Upload at least one resume file before running analysis.')
      return
    }
    if (files.length > MAX_RESUMES) {
      setStatusMessage(`Upload up to ${MAX_RESUMES} resumes at a time (you selected ${files.length}).`)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await requestBackendAnalysis({
        jobTitle,
        jobDescription,
        files
      })

      setAnalysisState(response)
      setRecentHistory(response.history || [])
      setStatusMessage('Analysis completed by the backend and synced to the UI.')
    } catch (error) {
      submitMockAnalysis(files)
      setStatusMessage(`${error.message}. Showing local preview instead.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Joyride
        onEvent={handleTourEvent}
        continuous
        run={runTour}
        scrollToFirstStep
        showProgress
        showSkipButton
        steps={tourSteps}
        styles={{
          options: {
            primaryColor: '#111827',
            textColor: '#111827',
            zIndex: 40
          }
        }}
      />

      <section className="animate-fade-rise relative overflow-hidden rounded-3xl border border-slate/20 bg-white/90 p-6 shadow-soft backdrop-blur-sm md:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-coral/20 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-mint/25 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex rounded-full border border-ink/15 bg-paper px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/65">
            Phase 2: Analyze Request
          </p>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-ink transition hover:border-ink/30"
            >
              Back
            </button>
            <Link
              to="/"
              className="rounded-lg border border-ink/15 bg-paper px-3 py-2 text-ink transition hover:border-ink/30"
            >
              Home
            </Link>
          </div>
        </div>
        <h1 className="mt-2 font-display text-4xl text-ink">Submit Job Description + Resumes</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink/70">
          Enter a role brief, upload resumes, and let the backend return ranked analysis and chart data.
        </p>

        <p className="relative mt-4 rounded-2xl border border-slate/20 bg-paper px-4 py-3 text-sm text-ink/75">
          {statusMessage}
        </p>

        <form className="tour-request-form mt-6 grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-xs uppercase tracking-[0.12em] text-ink/65">Role Name</span>
              <input
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                className="min-h-11 rounded-xl border border-slate/30 bg-paper px-4 text-sm text-ink outline-none transition focus:border-ink/55"
                placeholder="Enter role title"
                required
              />
            </label>

            <label className="tour-upload-field grid gap-2">
              <span className="text-xs uppercase tracking-[0.12em] text-ink/65">Upload Resumes</span>
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.txt"
                onChange={(event) => setUploadedFiles(event.target.files ? [...event.target.files] : [])}
                className="min-h-11 rounded-xl border border-slate/30 bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/55"
              />
              <p className="text-xs text-ink/55">
                {uploadedFiles.length > 0
                  ? `${uploadedFiles.length} file(s) selected (max ${MAX_RESUMES}).`
                  : `PDF, DOCX, or TXT — up to ${MAX_RESUMES} per run.`}
              </p>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="text-xs uppercase tracking-[0.12em] text-ink/65">Job Description</span>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              className="min-h-44 rounded-xl border border-slate/30 bg-paper px-4 py-3 text-sm leading-6 text-ink outline-none transition focus:border-ink/55"
              placeholder="Describe required skills, responsibilities, and constraints"
              required
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink/65">
              Running analysis for: <span className="font-semibold text-ink">{jobTitle}</span>
            </p>
            <button
              type="submit"
              className="tour-submit-action min-h-11 rounded-xl bg-ink px-5 text-sm font-semibold text-paper transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Run Analysis'}
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 lg:items-stretch">
        <AnalyzeCard
          className="flex h-full min-h-0 flex-col lg:max-h-[26.5rem]"
          label="Process clarity"
          title="How this run works"
          variant="inset"
          delay={80}
        >
          <ol className="grid gap-3 text-sm text-ink/75">
            {[
              'Add role details and job context.',
              'Upload CV files and run analysis.',
              'Review distribution, fit mix, and shortlist charts.',
              'Revisit saved runs from backend history.'
            ].map((step, index) => (
              <li
                key={step}
                className="rounded-2xl border border-slate/20 bg-white px-4 py-3"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/50">
                  Step {index + 1}
                </span>
                <p className="mt-1 font-medium text-ink">{step}</p>
              </li>
            ))}
          </ol>
        </AnalyzeCard>

        <AnalyzeCard
          className="flex h-full min-h-0 flex-col lg:max-h-[26.5rem]"
          contentClassName="flex min-h-0 flex-1 flex-col"
          label="History"
          title="Recent analysis runs"
          delay={150}
        >
          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
            <div className="grid gap-2">
              {recentHistory.length === 0 && (
                <p className="rounded-2xl border border-dashed border-slate/30 bg-paper px-4 py-6 text-center text-sm text-ink/60">
                  No recent runs yet.
                </p>
              )}
              {recentHistory.map((run) => (
                <div
                  key={run.analysisId || run.processedAt || run.jobTitle}
                  className="rounded-2xl border border-slate/20 bg-paper px-4 py-3"
                >
                  <p className="font-semibold text-ink">{run.jobTitle}</p>
                  <p className="mt-1 text-sm text-ink/65">
                    {run.totalResumes} resumes · Avg {run.avgScore}% · Top {run.topScore}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </AnalyzeCard>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <AnalyzeStatCard
          label="Resumes processed"
          value={analysisState?.summary.totalResumes ?? '—'}
          hint={analysisState ? 'In this analysis batch' : 'Run analysis to populate'}
          tone="mint"
          delay={80}
        />
        <AnalyzeStatCard
          label="Average match"
          value={analysisState ? `${analysisState.summary.avgScore}%` : '—'}
          hint={analysisState ? 'Mean model match score' : undefined}
          tone="ink"
          delay={150}
        />
        <AnalyzeStatCard
          label="Top score"
          value={analysisState ? `${analysisState.summary.topScore}%` : '—'}
          hint={analysisState ? 'Best candidate in this run' : undefined}
          tone="coral"
          delay={220}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <AnalyzeCard label="Matched skills" title="Found across the pool" variant="accent" delay={80}>
          <div className="flex flex-wrap gap-2">
            {matchedKeywords.length === 0 && (
              <p className="text-sm text-ink/60">No skills matched yet.</p>
            )}
            {matchedKeywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-mint/30 px-3 py-1 text-sm font-medium text-ink">
                {keyword}
              </span>
            ))}
          </div>
        </AnalyzeCard>

        <AnalyzeCard label="Missing skills" title="Gaps to review" variant="highlight" delay={150}>
          <div className="flex flex-wrap gap-2">
            {missingKeywords.length === 0 && (
              <p className="text-sm text-ink/60">No skill gaps flagged yet.</p>
            )}
            {missingKeywords.map((keyword) => (
              <span key={keyword} className="rounded-full bg-coral/25 px-3 py-1 text-sm font-medium text-ink">
                {keyword}
              </span>
            ))}
          </div>
        </AnalyzeCard>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-ink/15 bg-ink p-6 text-paper shadow-soft md:p-8">
        <div className="pointer-events-none absolute -right-10 top-0 h-40 w-40 rounded-full bg-mint/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-paper/60">Top ranked CVs</p>
          <h2 className="mt-2 font-display text-3xl">Shortlist preview</h2>
          <div className="mt-5 grid gap-3">
            {topThree.length === 0 && (
              <p className="rounded-2xl border border-paper/20 bg-paper/5 px-4 py-5 text-sm text-paper/80">
                Upload resumes and run an analysis to see ranked candidates here.
              </p>
            )}
            {topThree.map((resume, index) => (
              <article
                key={resume.id}
                className="rounded-2xl border border-paper/15 bg-paper/5 px-4 py-4 backdrop-blur-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">
                    <span className="mr-2 font-display text-coral">#{index + 1}</span>
                    {resume.resumeName}
                  </p>
                  <span className="rounded-full bg-mint/90 px-3 py-1 text-xs font-semibold text-ink">
                    {resume.score}% match
                  </span>
                </div>
                {resume.fitLabel ? (
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-mint">
                    {resume.fitLabel}
                  </p>
                ) : null}
                <p className="mt-2 text-sm leading-6 text-paper/85">{resume.recommendation}</p>
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-xs uppercase tracking-[0.12em] text-paper/55">
                    <span>Skill coverage</span>
                    <span>{resume.keywordCoverage ?? 0}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-paper/15">
                    <div
                      className="h-full rounded-full bg-coral transition-all"
                      style={{ width: `${resume.keywordCoverage ?? 0}%` }}
                    />
                  </div>
                </div>
                <p className="mt-3 text-sm text-paper/75">{resume.explanation}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(resume.matchedKeywords || []).map((keyword) => (
                    <span
                      key={`${resume.id}-match-${keyword}`}
                      className="rounded-full bg-mint/25 px-3 py-1 text-xs text-paper"
                    >
                      {keyword}
                    </span>
                  ))}
                  {(resume.missingKeywords || []).map((keyword) => (
                    <span
                      key={`${resume.id}-missing-${keyword}`}
                      className="rounded-full bg-coral/30 px-3 py-1 text-xs text-paper"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Suspense
        fallback={
          <AnalyzeCard
            className="tour-chart-panel"
            label="Analytics"
            title="Loading charts…"
            description="Preparing distribution and shortlist visuals."
          />
        }
      >
        <div className="tour-chart-panel">
          {analysisState ? (
            <AnalysisCharts analysis={analysisState} />
          ) : (
            <AnalyzeCard
              label="Analytics"
              title="Charts unlock after your first run"
              description="You will see score distribution, model fit mix, a top-candidate bar chart, and a skill-coverage scatter plot."
            />
          )}
        </div>
      </Suspense>
    </div>
  )
}

export default AnalyzePage
