import { Link, useParams } from 'react-router-dom'
import { candidates, jobs } from '../data/mockData'

function ReportPage() {
  const { candidateId } = useParams()
  const candidate = candidates.find((item) => item.id === candidateId)

  if (!candidate) {
    return (
      <section className="rounded-3xl border border-slate/20 bg-white p-8 shadow-soft">
        <h1 className="font-display text-4xl text-ink">Report Not Found</h1>
        <p className="mt-2 text-sm text-ink/70">Pick a candidate from the pipeline to view a report.</p>
        <Link
          to="/pipeline"
          className="mt-6 inline-flex rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper"
        >
          Back to Pipeline
        </Link>
      </section>
    )
  }

  const benchmarkRole = jobs[0]
  const sectionScores = [
    { label: 'Skill Alignment', value: Math.min(98, candidate.score + 2) },
    { label: 'Role Relevance', value: Math.max(70, candidate.score - 4) },
    { label: 'Project Impact', value: Math.max(68, candidate.score - 8) },
    { label: 'Communication Signals', value: Math.max(72, candidate.score - 5) }
  ]

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-slate/20 bg-white p-6 shadow-soft md:p-8">
        <p className="text-xs uppercase tracking-[0.14em] text-ink/55">Detailed Candidate Analysis</p>
        <h1 className="mt-2 font-display text-4xl text-ink">{candidate.name}</h1>
        <p className="mt-2 text-sm text-ink/70">
          Compared against {benchmarkRole.title} profile requirements with mock scoring signals.
        </p>

        <div className="mt-4 inline-flex rounded-full bg-mint/35 px-4 py-1 text-sm font-semibold text-ink">
          Overall Match: {candidate.score}%
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {sectionScores.map((section) => (
          <article
            key={section.label}
            className="rounded-2xl border border-slate/20 bg-white p-5 shadow-soft"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-ink">{section.label}</p>
              <p className="text-sm text-ink/60">{section.value}%</p>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate/30">
              <div
                className="h-full rounded-full bg-coral"
                style={{ width: `${section.value}%` }}
              />
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-3xl border border-slate/20 bg-ink p-6 text-paper shadow-soft md:p-8">
        <h2 className="font-display text-3xl">Recommendation</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-paper/80">{candidate.recommendation}</p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-paper/60">Observed Strengths</p>
            <ul className="mt-2 space-y-2">
              {candidate.strengths.map((point) => (
                <li key={point} className="rounded-xl border border-paper/20 px-3 py-2 text-sm">
                  {point}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-paper/60">Potential Interview Probes</p>
            <ul className="mt-2 space-y-2">
              {candidate.gaps.map((point) => (
                <li key={point} className="rounded-xl border border-paper/20 px-3 py-2 text-sm">
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ReportPage
