const TONES = {
  light: 'bg-surface text-ink',
  paper: 'bg-paper text-ink',
  dark: 'bg-ink text-paper'
}

export function Section({
  id,
  children,
  tone = 'light',
  className = '',
  divide = true,
  // legacy props from the previous layout
  band,
  dark
}) {
  const resolved = dark ? 'dark' : band ? 'light' : tone
  const border = divide
    ? resolved === 'dark'
      ? 'border-t border-white/10'
      : 'border-t border-ink/10'
    : ''

  return (
    <section id={id} className={`w-full ${TONES[resolved]} ${border} ${className}`.trim()}>
      <div className="gutter py-20 md:py-28 lg:py-32">{children}</div>
    </section>
  )
}

/**
 * One purpose, one headline, one supporting sentence. `split` moves the
 * supporting sentence into a second column so wide viewports read as a
 * composition rather than a stranded left column.
 */
export function SectionHead({
  eyebrow,
  title,
  lead,
  split = false,
  onDark = false,
  className = ''
}) {
  const heading = (
    <div className={split ? '' : 'max-w-3xl'}>
      {eyebrow ? <p className={onDark ? 'eyebrow-on-dark' : 'eyebrow'}>{eyebrow}</p> : null}
      <h2
        className={`display-title mt-5 text-[2rem] sm:text-[2.5rem] lg:text-[3.125rem] ${
          onDark ? 'text-paper' : 'text-ink'
        }`}
      >
        {title}
      </h2>
    </div>
  )

  if (!split) {
    return (
      <div className={`max-w-3xl ${className}`.trim()}>
        {heading}
        {lead ? <p className={`mt-6 max-w-[54ch] ${onDark ? 'lead-on-dark' : 'lead'}`}>{lead}</p> : null}
      </div>
    )
  }

  return (
    <div className={`grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-20 ${className}`.trim()}>
      {heading}
      {lead ? (
        <p className={`max-w-[46ch] lg:self-end ${onDark ? 'lead-on-dark' : 'lead'}`}>{lead}</p>
      ) : null}
    </div>
  )
}

export default Section
