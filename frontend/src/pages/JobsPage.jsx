import { useMemo, useState } from 'react'
import { candidates, jobs } from '../data/mockData'

function scoreFit(candidate, job) {
  const normalizedStrengths = candidate.strengths.map((item) => item.toLowerCase())
  const matchingSkills = job.mustHave.filter((skill) =>
    normalizedStrengths.some((owned) => owned.includes(skill.toLowerCase().split(' ')[0]))
  )

  const boost = matchingSkills.length * 2.8
  return Math.min(97, Math.round(candidate.score * 0.78 + boost))
}

function JobsPage() {
  const [activeJobId, setActiveJobId] = useState(jobs[0].id)

  const activeJob = useMemo(
    () => jobs.find((job) => job.id === activeJobId) ?? jobs[0],
    [activeJobId]
  )

  const rankedForJob = useMemo(() => {
    return candidates
      .map((candidate) => ({
        ...candidate,
        tailoredScore: scoreFit(candidate, activeJob)
      }))
      .sort((a, b) => b.tailoredScore - a.tailoredScore)
  }, [activeJob])

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <aside className="rounded-3xl border border-slate/20 bg-white p-4 shadow-soft">
        <p className="px-2 text-xs uppercase tracking-[0.16em] text-ink/55">Job Tracks</p>
        <div className="mt-3 space-y-2">
          {jobs.map((job) => {
            const isActive = job.id === activeJob.id
            return (
              <button
                type="button"
                key={job.id}
                onClick={() => setActiveJobId(job.id)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-ink bg-ink text-paper'
                    : 'border-slate/20 bg-paper text-ink hover:border-ink/30'
                }`}
              >
                <p className="font-semibold">{job.title}</p>
                <p className={`text-xs ${isActive ? 'text-paper/70' : 'text-ink/55'}`}>
                  {job.team}
                </p>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="rounded-3xl border border-slate/20 bg-white p-6 shadow-soft md:p-8">
        <h1 className="font-display text-4xl text-ink">{activeJob.title}</h1>
        <p className="mt-2 text-sm text-ink/70">{activeJob.focus}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {activeJob.mustHave.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-mint/45 bg-mint/30 px-3 py-1 text-xs text-ink"
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {rankedForJob.map((candidate) => (
            <article
              key={candidate.id}
              className="rounded-2xl border border-slate/20 bg-paper p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-display text-2xl text-ink">{candidate.name}</h2>
                  <p className="text-sm text-ink/60">{candidate.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-[0.12em] text-ink/50">Role Fit</p>
                  <p className="font-display text-2xl text-ink">{candidate.tailoredScore}%</p>
                </div>
              </div>

              <div className="mt-3 h-2 rounded-full bg-slate/30">
                <div
                  className="h-full rounded-full bg-ink"
                  style={{ width: `${candidate.tailoredScore}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default JobsPage
