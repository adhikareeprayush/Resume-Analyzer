import { Link } from 'react-router-dom'
import PublicLayout from '../layouts/PublicLayout'
import FocusField from '../components/brand/FocusField'
import { Button } from '../components/ui'
import { Section, SectionHead } from '../components/ui/Section'

const STEPS = [
  { n: '01', t: 'Define the role', d: 'Title, must-haves, and the context that matters.' },
  { n: '02', t: 'Build the form', d: 'Screening questions plus a resume upload.' },
  { n: '03', t: 'Share one link', d: 'Candidates apply without creating an account.' },
  { n: '04', t: 'Read the ranking', d: 'Fit scores with the reasoning attached.' }
]

const READOUT = [
  { name: 'Bibek Karki', verdict: 'Good fit', score: 84, note: 'Ships production NLP; owns model evaluation.' },
  { name: 'Prisha Adhikari', verdict: 'Good fit', score: 79, note: 'Strong Python and API work, lighter on NLP.' },
  { name: 'Rohan Bhandari', verdict: 'Potential', score: 62, note: 'Analytics depth, no deployment experience.' }
]

function Hero() {
  return (
    <section className="plane-dark grain hero-fill relative isolate flex w-full flex-col overflow-hidden">
      {/* Below lg the field takes whatever height the type leaves, so the lens can
          never land on the wordmark. From lg it becomes the full plane again. */}
      <div className="relative min-h-28 flex-1 lg:absolute lg:inset-0 lg:flex-none">
        <FocusField focus="center" className="lg:hidden" />
        <FocusField focus="right" className="hidden lg:block" />
      </div>

      {/* One scrim across the whole plane, so the field has no visible bottom seam. */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_top,rgb(13,17,16)_34%,rgba(13,17,16,0.62)_58%,rgba(13,17,16,0.05))] lg:bg-[linear-gradient(to_right,rgba(13,17,16,0.96),rgba(13,17,16,0.64)_44%,rgba(13,17,16,0)_74%)]" />

      <div className="gutter relative z-10 pb-12 sm:pb-16 lg:absolute lg:inset-0 lg:flex lg:flex-col lg:justify-center lg:pb-0">
        <div className="w-full max-w-[46rem]">
          <h1 className="animate-rise brand-mark text-[clamp(3rem,12.5vw,9rem)] text-paper">
            TalentLens
          </h1>

          <div className="animate-rise stagger-1 mt-8 border-t border-white/15 pt-8 sm:mt-10 sm:pt-10">
            <p className="display-title max-w-[30ch] text-[clamp(1.35rem,3.2vw,2.25rem)] text-paper/95">
              Every resume, read through the lens of the role.
            </p>
            <p className="animate-rise stagger-2 mt-5 max-w-[52ch] text-[0.975rem] leading-[1.75] text-paper/60 sm:text-lg">
              Post a role, collect applications through one link, and get a ranked shortlist with the
              reasoning behind every score.
            </p>
          </div>

          <div className="animate-rise stagger-3 mt-9 flex flex-wrap items-center gap-3">
            <Button as={Link} to="/signup" variant="onDark" className="px-7">
              Hire with TalentLens
            </Button>
            <Button as={Link} to="/candidate/signup" variant="quietOnDark" className="px-7">
              I’m a candidate
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function LandingPage() {
  return (
    <PublicLayout tone="dark">
      <Hero />

      <Section id="idea" tone="light" divide={false}>
        <SectionHead
          split
          eyebrow="The idea"
          title={
            <>
              One question decides every shortlist: does this person fit{' '}
              <span className="text-signal">this</span> role?
            </>
          }
          lead="TalentLens scores each resume against the job you actually posted — the skills you asked for, the depth you need — and explains what it found."
        />
      </Section>

      <Section id="workflow" tone="paper">
        <SectionHead eyebrow="How it works" title="From open role to ranked shortlist." />
        <ol className="mt-16 grid gap-10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((step) => (
            <li key={step.n} className="border-t border-ink/20 pt-6">
              <p className="readout text-sm font-medium text-signal">{step.n}</p>
              <p className="mt-5 font-display text-lg font-bold tracking-[-0.02em] text-ink">
                {step.t}
              </p>
              <p className="mt-2.5 max-w-[28ch] text-sm leading-7 text-muted">{step.d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="ranking" tone="dark">
        <SectionHead
          split
          onDark
          eyebrow="Explainable scores"
          title="A ranking you can defend in the hiring meeting."
          lead="Each candidate arrives with a fit score, a verdict, and the evidence the model used to get there."
        />

        <div className="mt-16 lg:mt-20">
          <div className="hidden grid-cols-[1fr_9rem_5rem] gap-6 border-b border-white/15 pb-3 sm:grid">
            <p className="eyebrow-on-dark">Candidate</p>
            <p className="eyebrow-on-dark">Verdict</p>
            <p className="eyebrow-on-dark text-right">Fit</p>
          </div>
          <ul>
            {READOUT.map((row) => (
              <li
                key={row.name}
                className="grid gap-2 border-b border-white/10 py-6 sm:grid-cols-[1fr_9rem_5rem] sm:items-baseline sm:gap-6"
              >
                <div className="min-w-0">
                  <p className="text-base font-medium text-paper">{row.name}</p>
                  <p className="mt-1.5 max-w-[52ch] text-sm leading-6 text-paper/50">{row.note}</p>
                </div>
                <p
                  className={`font-mono text-xs uppercase tracking-[0.14em] ${
                    row.verdict === 'Good fit' ? 'text-ok-hot' : 'text-warn-hot'
                  }`}
                >
                  {row.verdict}
                </p>
                <p className="readout text-3xl font-medium text-paper sm:text-right">{row.score}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="light">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
          <SectionHead
            eyebrow="For candidates"
            title="Applying takes minutes, not accounts."
            lead="Open the employer's link, answer a short form, attach a resume, done."
            className="lg:max-w-xl"
          />
          <Button
            as={Link}
            to="/apply/northstar-nextjs-2026"
            variant="secondary"
            className="shrink-0 px-7"
          >
            View a sample application
          </Button>
        </div>
      </Section>

      <Section tone="dark">
        <div className="flex flex-col items-start gap-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="brand-mark text-[clamp(2.5rem,7vw,5.5rem)] text-paper">TalentLens</p>
            <p className="mt-6 max-w-[46ch] text-base leading-[1.75] text-paper/55">
              Look closer at the people already in your pipeline.
            </p>
          </div>
          <Button as={Link} to="/signup" variant="onDark" className="shrink-0 px-8">
            Create your workspace
          </Button>
        </div>
      </Section>
    </PublicLayout>
  )
}

export default LandingPage
