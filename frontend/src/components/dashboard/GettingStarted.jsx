import { Card, QuickAction } from '../ui'

function GettingStarted({ hasJobs, hasForms, hasSubmissions }) {
  const steps = [
    {
      step: 'Step 1',
      title: 'Create a job',
      description: 'Define the role, its must-have skills, and the hiring context.',
      to: '/dashboard/jobs/new',
      done: hasJobs
    },
    {
      step: 'Step 2',
      title: 'Publish a form',
      description: 'Build the application form and share its public link.',
      to: '/dashboard/jobs',
      done: hasForms
    },
    {
      step: 'Step 3',
      title: 'Rank applicants',
      description: 'Open a form’s applications and score them against the role.',
      to: '/dashboard/jobs',
      done: hasSubmissions
    }
  ]

  const completed = steps.filter((s) => s.done).length
  if (completed === steps.length) return null

  return (
    <Card
      eyebrow="Getting started"
      title="Set up your hiring workflow"
      description={`${completed} of ${steps.length} steps complete.`}
      padding="sm"
    >
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((item) =>
          item.done ? (
            <div
              key={item.title}
              className="flex flex-col rounded-[var(--radius-shell)] border border-ok/25 bg-ok-tint/60 p-5"
            >
              <p className="eyebrow text-ok">{item.step}</p>
              <p className="mt-2 font-display text-base font-bold tracking-[-0.02em] text-ink">
                {item.title}
              </p>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{item.description}</p>
              <p className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-ok">
                Complete
              </p>
            </div>
          ) : (
            <QuickAction
              key={item.title}
              step={item.step}
              title={item.title}
              description={item.description}
              to={item.to}
            />
          )
        )}
      </div>
    </Card>
  )
}

export default GettingStarted
