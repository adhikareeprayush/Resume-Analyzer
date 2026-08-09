import { Joyride, STATUS } from 'react-joyride'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { requestBackendAnalysis } from '../services/analysisApi'
import { loadDraft, saveDraft } from '../utils/storage'

import {
  Alert,
  Button,
  Card,
  DashboardPage,
  Field,
  FileInput,
  FitLabel,
  Spinner,
  StatCard,
  TextArea,
  TextInput
} from '../components/ui'

const AnalysisCharts = lazy(() => import('../components/AnalysisCharts'))
const MAX_RESUMES = Number(import.meta.env.VITE_MAX_RESUMES) || 150

const tourSteps = [
  {
    target: '.tour-request-form',
    title: 'Role context',
    content: 'Enter the role title and paste the job description so ranking has clear context.',
    skipBeacon: true
  },
  {
    target: '.tour-upload-field',
    title: 'Upload resumes',
    content: 'Add PDF, DOCX, or TXT files. Up to 150 resumes per batch.',
    skipBeacon: true
  },
  {
    target: '.tour-submit-action',
    title: 'Run analysis',
    content: 'Submit to rank every resume against the role with explainable scores.',
    skipBeacon: true
  },
  {
    target: '.tour-chart-panel',
    title: 'Review results',
    content: 'Explore score distribution, fit mix, shortlist bars, and skill coverage.',
    skipBeacon: true
  }
]

function AnalyzePage() {
  const draft = loadDraft()

  const [jobTitle, setJobTitle] = useState(draft?.jobTitle || 'Machine Learning Engineer')
  const [jobDescription, setJobDescription] = useState(
    draft?.jobDescription ||
      'We need a machine learning engineer with Python, model evaluation, Flask APIs, and NLP exposure.'
  )
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusTone, setStatusTone] = useState('info')
  const [runTour, setRunTour] = useState(false)
  const [analysisState, setAnalysisState] = useState(null)

  const topThree = useMemo(() => analysisState?.rankedResumes?.slice(0, 3) ?? [], [analysisState])
  const matchedKeywords = analysisState?.matchedKeywords ?? []
  const missingKeywords = analysisState?.missingKeywords ?? []
  const hasSkillInsights = matchedKeywords.length > 0 || missingKeywords.length > 0

  useEffect(() => {
    saveDraft({ jobTitle, jobDescription })
  }, [jobTitle, jobDescription])

  const handleTourEvent = (data) => {
    const { status, type } = data
    const tourEnded =
      type === 'tour:end' || status === STATUS.FINISHED || status === STATUS.SKIPPED

    if (tourEnded) {
      setRunTour(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const files = Array.from(uploadedFiles)

    if (files.length === 0) {
      setStatusMessage('Upload at least one resume file before running analysis.')
      setStatusTone('warning')
      return
    }
    if (files.length > MAX_RESUMES) {
      setStatusMessage(`Upload up to ${MAX_RESUMES} resumes at a time (you selected ${files.length}).`)
      setStatusTone('warning')
      return
    }

    setIsSubmitting(true)
    setStatusMessage('')

    try {
      const response = await requestBackendAnalysis({
        jobTitle,
        jobDescription,
        files
      })

      setAnalysisState(response)
      setStatusMessage('Analysis complete.')
      setStatusTone('success')
    } catch (error) {
      setStatusMessage(error.message || 'Analysis failed. Check that the API is running.')
      setStatusTone('warning')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardPage
      wide
      eyebrow="AI ranking"
      title="Resume analysis"
      description="Upload a batch of resumes and rank them against the role you are hiring for."
      actions={
        <Button type="button" variant="secondary" onClick={() => setRunTour(true)}>
          How it works
        </Button>
      }
    >
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
            primaryColor: '#c0350f',
            textColor: '#0d1110',
            arrowColor: '#ffffff',
            backgroundColor: '#ffffff',
            zIndex: 40
          }
        }}
      />

      <Card title="New analysis" description="Define the role, upload resumes, and run the fit model.">
        {statusMessage ? (
          <Alert tone={statusTone} className="mb-5" onDismiss={() => setStatusMessage('')}>
            {statusMessage}
          </Alert>
        ) : null}

        <form className="tour-request-form grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Role name" required>
              <TextInput
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                placeholder="Enter role title"
                required
              />
            </Field>

            <div className="tour-upload-field">
              <Field label="Upload resumes" hint={`PDF, DOCX, or TXT · max ${MAX_RESUMES} files`}>
                <FileInput
                  multiple
                  accept=".pdf,.docx,.txt"
                  onChange={(event) =>
                    setUploadedFiles(event.target.files ? [...event.target.files] : [])
                  }
                />
              </Field>
              {uploadedFiles.length > 0 ? (
                <p className="readout mt-2 text-xs text-ok">{uploadedFiles.length} selected</p>
              ) : null}
            </div>
          </div>

          <Field label="Job description" required>
            <TextArea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Describe required skills, responsibilities, and constraints"
              required
            />
          </Field>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ink/10 pt-5">
            <Button
              type="submit"
              variant="primary"
              className="tour-submit-action"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Spinner />
                  Processing…
                </>
              ) : (
                'Run analysis'
              )}
            </Button>
          </div>
        </form>
      </Card>

      {analysisState ? (
        <>
          <section className="grid gap-6 sm:grid-cols-3 sm:gap-8">
            <StatCard
              label="Resumes processed"
              value={analysisState.summary.totalResumes}
              hint="This batch"
            />
            <StatCard label="Average match" value={`${analysisState.summary.avgScore}%`} />
            <StatCard
              label="Top score"
              value={`${analysisState.summary.topScore}%`}
              accent="signal"
            />
          </section>

          {topThree.length > 0 ? (
            <Card variant="ink" eyebrow="Shortlist" title="Top ranked candidates">
              <ul className="grid gap-5">
                {topThree.map((resume, index) => (
                  <li key={resume.id} className="border-t border-white/12 pt-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                      <p className="flex items-baseline gap-3 text-base font-medium text-paper">
                        <span className="readout text-signal-hot">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        {resume.resumeName}
                      </p>
                      <p className="readout text-2xl font-medium text-paper">{resume.score}%</p>
                    </div>

                    <FitLabel label={resume.fitLabel} className="mt-2" />

                    {resume.recommendation ? (
                      <p className="mt-3 max-w-[76ch] text-sm leading-6 text-paper/80">
                        {resume.recommendation}
                      </p>
                    ) : null}

                    <div className="mt-4 max-w-md">
                      <div className="mb-2 flex justify-between font-mono text-[0.7rem] uppercase tracking-[0.14em] text-paper/45">
                        <span>Skill coverage</span>
                        <span className="readout">{resume.keywordCoverage ?? 0}%</span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-white/12">
                        <div
                          className="h-full rounded-full bg-ok-hot transition-all duration-700"
                          style={{ width: `${resume.keywordCoverage ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {resume.explanation ? (
                      <p className="mt-4 max-w-[76ch] text-sm leading-6 text-paper/55">
                        {resume.explanation}
                      </p>
                    ) : null}

                    {resume.matchedKeywords?.length || resume.missingKeywords?.length ? (
                      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                        {resume.matchedKeywords?.length ? (
                          <div>
                            <dt className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-paper/40">
                              Matched
                            </dt>
                            <dd className="mt-1.5 leading-6 text-ok-hot">
                              {resume.matchedKeywords.join(' · ')}
                            </dd>
                          </div>
                        ) : null}
                        {resume.missingKeywords?.length ? (
                          <div>
                            <dt className="font-mono text-[0.7rem] uppercase tracking-[0.14em] text-paper/40">
                              Missing
                            </dt>
                            <dd className="mt-1.5 leading-6 text-warn-hot">
                              {resume.missingKeywords.join(' · ')}
                            </dd>
                          </div>
                        ) : null}
                      </dl>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Suspense
            fallback={
              <Card
                className="tour-chart-panel"
                eyebrow="Analytics"
                title="Loading charts…"
                description="Preparing distribution and shortlist visuals."
              />
            }
          >
            <div className="tour-chart-panel">
              <AnalysisCharts analysis={analysisState} />
            </div>
          </Suspense>

          {hasSkillInsights ? (
            <section className="grid gap-6 lg:grid-cols-2">
              {matchedKeywords.length > 0 ? (
                <Card eyebrow="Skills" title="Matched across the pool" padding="sm">
                  <p className="text-sm leading-7 text-ok">{matchedKeywords.join(' · ')}</p>
                </Card>
              ) : null}

              {missingKeywords.length > 0 ? (
                <Card eyebrow="Gaps" title="Missing across the pool" padding="sm">
                  <p className="text-sm leading-7 text-warn">{missingKeywords.join(' · ')}</p>
                </Card>
              ) : null}
            </section>
          ) : null}
        </>
      ) : null}
    </DashboardPage>
  )
}

export default AnalyzePage
