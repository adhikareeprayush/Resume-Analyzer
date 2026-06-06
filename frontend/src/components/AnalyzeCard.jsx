function AnalyzeCard({
  label,
  title,
  description,
  children,
  className = '',
  contentClassName = '',
  variant = 'surface',
  delay = 0
}) {
  const variants = {
    surface:
      'border-slate/20 bg-white/90 shadow-soft backdrop-blur-sm',
    inset: 'border-slate/20 bg-paper shadow-soft',
    accent:
      'border-mint/30 bg-gradient-to-br from-white via-white to-mint/15 shadow-soft',
    highlight:
      'border-coral/25 bg-gradient-to-br from-white via-white to-coral/10 shadow-soft'
  }

  return (
    <article
      className={`animate-fade-rise relative overflow-hidden rounded-3xl border p-5 md:p-6 ${variants[variant] || variants.surface} ${className}`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-mint/15 blur-2xl" />
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">{label}</p>
      ) : null}
      {title ? <h3 className="mt-2 font-display text-2xl text-ink md:text-3xl">{title}</h3> : null}
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">{description}</p> : null}
      {children ? (
        <div
          className={`${title || description ? 'mt-4' : ''} ${contentClassName}`.trim()}
        >
          {children}
        </div>
      ) : null}
    </article>
  )
}

export function AnalyzeStatCard({ label, value, hint, tone = 'ink', delay = 0 }) {
  const toneClasses = {
    ink: 'text-ink',
    mint: 'text-ink',
    coral: 'text-ink'
  }
  const accentBar = {
    ink: 'bg-ink',
    mint: 'bg-mint',
    coral: 'bg-coral'
  }

  return (
    <article
      className="animate-fade-rise relative overflow-hidden rounded-3xl border border-slate/20 bg-white/90 p-5 shadow-soft backdrop-blur-sm md:p-6"
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className={`absolute inset-y-0 left-0 w-1 ${accentBar[tone] || accentBar.ink}`} />
      <p className="pl-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">{label}</p>
      <p className={`mt-3 pl-3 font-display text-4xl ${toneClasses[tone]}`}>{value}</p>
      {hint ? <p className="mt-2 pl-3 text-sm text-ink/60">{hint}</p> : null}
    </article>
  )
}

export default AnalyzeCard
