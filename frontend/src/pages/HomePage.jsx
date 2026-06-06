import { Link } from 'react-router-dom'
import { dashboardStats } from '../data/mockData'

const workflowSteps = [
  {
    title: 'Create Analysis Request',
    detail: 'Add role context and paste the job description in one focused form.'
  },
  {
    title: 'Upload Candidate CVs',
    detail: 'Drop multiple resumes and trigger instant mock ranking analysis.'
  },
  {
    title: 'Review Ranked Analytics',
    detail: 'Inspect score buckets, confidence trends, and shortlist-ready profiles.'
  }
]

const experiencePoints = [
  'Single primary action above the fold for faster onboarding.',
  'Readable section hierarchy built for recruiters and hiring managers.',
  'Action-focused analytics cards with high-contrast visual language.'
]

function HomePage() {
  return (
    <div className="space-y-8 md:space-y-10">
      <section className="relative animate-fade-rise overflow-hidden rounded-3xl border border-slate/20 bg-white/75 p-8 shadow-soft backdrop-blur md:p-12">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full bg-coral/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-mint/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-16 h-40 w-40 rotate-12 border border-ink/15" />

        <p className="mb-3 inline-flex rounded-full border border-ink/20 bg-ink px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-paper">
          TalentLens Atlas
        </p>
        <h1 className="max-w-3xl font-display text-4xl leading-tight text-ink sm:text-5xl">
          Rank CVs against role requirements in one focused and recruiter-friendly workflow.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-ink/70 sm:text-base">
          TalentLens Atlas turns job descriptions and resume uploads into ranked fit insights with clear analytics, so your team can move from intake to shortlist faster.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/analyze"
            className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:-translate-y-0.5 hover:bg-ink/90"
          >
            Start New Analysis Request
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((item, index) => (
          <article
            key={item.label}
            className="animate-fade-rise rounded-2xl border border-slate/20 bg-white p-5 shadow-soft"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <p className="text-xs uppercase tracking-[0.12em] text-ink/55">{item.label}</p>
            <p className="mt-3 font-display text-3xl text-ink">{item.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <article className="rounded-3xl border border-slate/20 bg-white p-6 shadow-soft md:p-8">
          <p className="text-xs uppercase tracking-[0.14em] text-ink/55">How It Works</p>
          <h2 className="mt-2 font-display text-3xl text-ink">Built Around the Main Hiring Use Case</h2>
          <div className="mt-6 grid gap-4">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-slate/20 bg-paper p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-ink/55">Step {index + 1}</p>
                <p className="mt-1 text-lg font-semibold text-ink">{step.title}</p>
                <p className="mt-1 text-sm text-ink/70">{step.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-slate/20 bg-ink p-6 text-paper shadow-soft md:p-8">
          <p className="text-xs uppercase tracking-[0.14em] text-paper/60">UX Focus</p>
          <h2 className="mt-2 font-display text-3xl">Designed for Decision Speed</h2>
          <ul className="mt-5 grid gap-3">
            {experiencePoints.map((point) => (
              <li key={point} className="rounded-xl border border-paper/20 px-4 py-3 text-sm text-paper/90">
                {point}
              </li>
            ))}
          </ul>

          <Link to="/analyze" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-paper px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper/90">
            Go to Analysis Form
          </Link>
        </article>
      </section>
    </div>
  )
}

export default HomePage
