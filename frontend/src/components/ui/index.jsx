import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FIT_TEXT_ON_DARK, fitTone } from '../../utils/fit'
import { LensMark, Wordmark } from '../brand/Wordmark'

export { LensMark, Wordmark }

/** Kept for existing call sites; `compact` and `subtitle` map onto the lockup. */
export function Logo({ subtitle, compact = false, onDark = false }) {
  return <Wordmark onDark={onDark} showMeta={Boolean(subtitle) && !compact} meta={subtitle} />
}

const BUTTON_VARIANTS = {
  primary: 'btn btn-primary',
  signal: 'btn btn-signal',
  secondary: 'btn btn-secondary',
  ghost: 'btn btn-ghost',
  onDark: 'btn btn-on-dark',
  quietOnDark: 'btn btn-quiet-on-dark',
  ghostOnDark: 'btn btn-ghost-on-dark',
  mint: 'btn btn-primary'
}

export function Button({
  as: Component = 'button',
  variant = 'primary',
  className = '',
  children,
  ...props
}) {
  return (
    <Component
      className={`${BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.primary} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  )
}

const BADGE_TONES = {
  light: {
    neutral: 'tag tag-neutral',
    mint: 'tag tag-ok',
    ok: 'tag tag-ok',
    coral: 'tag tag-warn',
    warn: 'tag tag-warn',
    ink: 'tag tag-ink'
  },
  dark: {
    neutral: 'tag tag-on-dark',
    mint: 'tag tag-ok-on-dark',
    ok: 'tag tag-ok-on-dark',
    coral: 'tag tag-warn-on-dark',
    warn: 'tag tag-warn-on-dark',
    ink: 'tag tag-on-dark'
  }
}

export function Badge({ children, tone = 'neutral', onDark = false }) {
  const palette = BADGE_TONES[onDark ? 'dark' : 'light']
  return <span className={palette[tone] || palette.neutral}>{children}</span>
}

/** Mono verdict line used on the dark shortlist panels. */
export function FitLabel({ label, className = '' }) {
  if (!label) return null
  return (
    <p
      className={`font-mono text-[0.7rem] uppercase tracking-[0.14em] ${
        FIT_TEXT_ON_DARK[fitTone(label)]
      } ${className}`.trim()}
    >
      {label}
    </p>
  )
}

/**
 * A card is only used where it wraps interaction or a self-contained data
 * object. Section-level content should use plain headings and rules instead.
 */
export function Card({
  eyebrow,
  title,
  description,
  children,
  className = '',
  contentClassName = '',
  variant = 'surface',
  padding = 'default'
}) {
  const shells = {
    surface: 'panel',
    inset: 'panel-inset',
    ink: 'panel-dark',
    flat: 'rounded-[var(--radius-shell)] border border-ink/10 bg-paper/60'
  }
  const pads = {
    default: 'p-5 md:p-6',
    sm: 'p-4 md:p-5',
    none: ''
  }
  const isDark = variant === 'ink'
  const hasHeader = Boolean(eyebrow || title || description)

  return (
    <section className={`animate-rise ${shells[variant]} ${pads[padding]} ${className}`.trim()}>
      {hasHeader ? (
        <header className={padding === 'none' ? 'px-5 pt-5 md:px-6 md:pt-6' : ''}>
          {eyebrow ? <p className={isDark ? 'eyebrow-on-dark' : 'eyebrow'}>{eyebrow}</p> : null}
          {title ? (
            <h2
              className={`font-display text-lg font-bold tracking-[-0.02em] ${
                eyebrow ? 'mt-2' : ''
              } ${isDark ? 'text-paper' : 'text-ink'}`}
            >
              {title}
            </h2>
          ) : null}
          {description ? (
            <p
              className={`mt-1.5 max-w-2xl text-sm leading-6 ${
                isDark ? 'text-paper/65' : 'text-muted'
              }`}
            >
              {description}
            </p>
          ) : null}
        </header>
      ) : null}
      {children ? (
        <div className={`${hasHeader ? 'mt-5' : ''} ${contentClassName}`.trim()}>{children}</div>
      ) : null}
    </section>
  )
}

const ALERT_TONES = {
  info: 'alert alert-info',
  success: 'alert alert-success',
  error: 'alert alert-error',
  warning: 'alert alert-warning'
}

export function Alert({ tone = 'info', children, className = '', onDismiss }) {
  return (
    <div className={`${ALERT_TONES[tone] || ALERT_TONES.info} ${className}`.trim()} role="alert">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">{children}</div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 font-mono text-xs uppercase tracking-[0.12em] opacity-60 transition hover:opacity-100"
          >
            Close
          </button>
        ) : null}
      </div>
    </div>
  )
}

export function Breadcrumbs({ items }) {
  if (!items?.length) return null

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.14em]">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-2">
            {index > 0 ? (
              <span className="text-ink/20" aria-hidden="true">
                /
              </span>
            ) : null}
            {item.to ? (
              <Link to={item.to} className="text-faint transition hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className="text-muted">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Spinner({ className = '' }) {
  return <span className={`spinner ${className}`.trim()} aria-hidden="true" />
}

export function CopyButton({ text, label = 'Copy link', copiedLabel = 'Copied', className = '' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be unavailable
    }
  }

  return (
    <Button type="button" variant="secondary" className={className} onClick={handleCopy}>
      {copied ? copiedLabel : label}
    </Button>
  )
}

export function StepIndicator({ total, current }) {
  if (total <= 1) return null

  return (
    <div
      className="flex gap-1.5"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      {Array.from({ length: total }).map((_, index) => (
        <div
          key={index}
          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
            index <= current ? 'bg-signal' : 'bg-ink/12'
          }`}
        />
      ))}
    </div>
  )
}

export function QuickAction({ to, title, description, step }) {
  return (
    <Link to={to} className="quick-action group">
      {step ? <p className="eyebrow">{step}</p> : null}
      <p className="mt-2 font-display text-base font-bold tracking-[-0.02em] text-ink">{title}</p>
      <p className="mt-2 flex-1 text-sm leading-6 text-muted">{description}</p>
      <span className="mt-4 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-signal transition group-hover:text-ink">
        Start
      </span>
    </Link>
  )
}

export function PageHeader({ eyebrow, title, description, actions, breadcrumbs }) {
  return (
    <header className="animate-rise border-b border-ink/10 pb-6">
      {breadcrumbs?.length ? (
        <div className="mb-5">
          <Breadcrumbs items={breadcrumbs} />
        </div>
      ) : null}
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-8">
        <div className="min-w-0 max-w-2xl">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1 className="display-title mt-2.5 text-[1.75rem] text-ink md:text-[2.125rem]">
            {title}
          </h1>
          {description ? (
            <p className="mt-3 max-w-[58ch] text-sm leading-7 text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}

export function DashboardPage({
  eyebrow,
  title,
  description,
  actions,
  breadcrumbs,
  children,
  wide = false,
  className = ''
}) {
  const shell = wide ? 'dashboard-page-wide' : 'dashboard-page'
  return (
    <div className={`${shell} ${className}`.trim()}>
      {title ? (
        <PageHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          actions={actions}
          breadcrumbs={breadcrumbs}
        />
      ) : null}
      {children}
    </div>
  )
}

const METRIC_ACCENTS = {
  ink: 'text-ink',
  mint: 'text-ok',
  ok: 'text-ok',
  coral: 'text-warn',
  warn: 'text-warn',
  signal: 'text-signal'
}

/** A measured value. Mono numerals, hairline rule, no card chrome. */
export function StatCard({ label, value, hint, accent = 'ink' }) {
  return (
    <article className="animate-rise border-t border-ink/15 pt-4">
      <p className="eyebrow">{label}</p>
      <p className={`readout mt-3 text-[2.5rem] font-medium leading-none ${METRIC_ACCENTS[accent] || METRIC_ACCENTS.ink}`}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-xs text-faint">{hint}</p> : null}
    </article>
  )
}

export const Metric = StatCard

/** `bare` drops the dashed shell for use inside a Card, which already has one. */
export function EmptyState({ title, description, action, bare = false }) {
  const shell = bare
    ? 'px-0 py-8'
    : 'rounded-[var(--radius-shell)] border border-dashed border-ink/15 px-6 py-14'

  return (
    <div className={`flex flex-col items-center justify-center text-center ${shell}`}>
      <LensMark className="h-8 w-8 opacity-30" />
      <p className="mt-5 font-display text-lg font-bold tracking-[-0.02em] text-ink">{title}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}

export function Field({ label, hint, required, children }) {
  return (
    <label className="grid content-start gap-2">
      {label ? (
        <span className="field-label">
          {label}
          {required ? <span className="text-signal"> *</span> : null}
        </span>
      ) : null}
      {children}
      {hint ? <span className="text-xs leading-5 text-faint">{hint}</span> : null}
    </label>
  )
}

export function TextInput({ className = '', ...props }) {
  return <input className={`field-input ${className}`.trim()} {...props} />
}

export function TextArea({ className = '', ...props }) {
  return <textarea className={`field-input min-h-32 py-3 leading-6 ${className}`.trim()} {...props} />
}

export function SelectInput({ className = '', children, ...props }) {
  return (
    <select className={`field-input ${className}`.trim()} {...props}>
      {children}
    </select>
  )
}

export function FileInput({ className = '', ...props }) {
  return <input type="file" className={`field-file ${className}`.trim()} {...props} />
}
