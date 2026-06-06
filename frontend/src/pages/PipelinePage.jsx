import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { candidates } from '../data/mockData'

function PipelinePage() {
  const [query, setQuery] = useState('')
  const [minScore, setMinScore] = useState(75)

  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((candidate) => candidate.score >= minScore)
      .filter((candidate) => {
        const text = `${candidate.name} ${candidate.role}`.toLowerCase()
        return text.includes(query.toLowerCase())
      })
      .sort((a, b) => b.score - a.score)
  }, [query, minScore])

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate/20 bg-white p-6 shadow-soft md:p-8">
        <h1 className="font-display text-4xl text-ink">Candidate Pipeline</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/70">
          Search profiles, apply a score threshold, and jump into detailed report views.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_240px]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by candidate name or role"
            className="w-full rounded-xl border border-slate/25 bg-paper px-4 py-3 text-sm text-ink outline-none transition focus:border-ink/50"
          />
          <label className="rounded-xl border border-slate/25 bg-paper px-4 py-3 text-sm text-ink">
            <span className="mr-3 text-xs uppercase tracking-[0.1em] text-ink/60">
              Min Score
            </span>
            <input
              type="range"
              min="60"
              max="95"
              value={minScore}
              onChange={(event) => setMinScore(Number(event.target.value))}
              className="mt-2 w-full"
            />
            <span className="mt-1 block text-right text-sm font-semibold">{minScore}%</span>
          </label>
        </div>
      </header>

      <section className="grid gap-4">
        {filteredCandidates.map((candidate) => (
          <article
            key={candidate.id}
            className="rounded-2xl border border-slate/20 bg-white p-5 shadow-soft"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl text-ink">{candidate.name}</h2>
                <p className="text-sm text-ink/65">
                  {candidate.role} • {candidate.experience}
                </p>
              </div>
              <div className="rounded-full bg-mint/35 px-3 py-1 text-sm font-semibold text-ink">
                Match {candidate.score}%
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-ink/60">Strengths</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidate.strengths.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full border border-ink/15 bg-paper px-3 py-1 text-xs"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-ink/60">Development Gaps</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidate.gaps.map((gap) => (
                    <span
                      key={gap}
                      className="rounded-full border border-coral/30 bg-coral/20 px-3 py-1 text-xs text-ink"
                    >
                      {gap}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-4 text-sm text-ink/75">{candidate.recommendation}</p>
            <Link
              to={`/reports/${candidate.id}`}
              className="mt-4 inline-flex rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper transition hover:bg-ink/90"
            >
              View Detailed Report
            </Link>
          </article>
        ))}

        {filteredCandidates.length === 0 && (
          <article className="rounded-2xl border border-slate/20 bg-white p-6 text-center shadow-soft">
            <p className="font-display text-2xl text-ink">No matching candidates</p>
            <p className="mt-2 text-sm text-ink/65">
              Try lowering the score threshold or search with a broader keyword.
            </p>
          </article>
        )}
      </section>
    </div>
  )
}

export default PipelinePage
