import { Link } from 'react-router-dom'

/** Aperture glyph: two rings, a reticle cut, and the signal catchlight. */
export function LensMark({ className = '', onDark = false }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      role="img"
      aria-label="TalentLens"
      focusable="false"
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        fill="none"
        stroke={onDark ? '#f2f3f1' : '#0d1110'}
        strokeWidth="1.6"
        opacity={onDark ? 0.55 : 0.35}
      />
      <circle
        cx="16"
        cy="16"
        r="8.5"
        fill="none"
        stroke={onDark ? '#f2f3f1' : '#0d1110'}
        strokeWidth="2"
      />
      <path
        d="M16 1.5v5M16 25.5v5M1.5 16h5M25.5 16h5"
        stroke={onDark ? '#f2f3f1' : '#0d1110'}
        strokeWidth="1.6"
        opacity={onDark ? 0.5 : 0.3}
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="3" fill={onDark ? '#f2603a' : '#c0350f'} />
    </svg>
  )
}

/**
 * App-chrome lockup. The landing hero uses the large `brand-mark` treatment
 * instead — this is the compact, functional version.
 */
export function Wordmark({ to = '/', onDark = false, showMeta = false, meta = 'Fit ranking' }) {
  return (
    <Link to={to} className="group flex items-center gap-2.5" aria-label="TalentLens home">
      <LensMark className="h-7 w-7 shrink-0 transition duration-300 group-hover:rotate-45" onDark={onDark} />
      <span className="flex flex-col leading-none">
        <span
          className={`font-display text-[1.0625rem] font-bold tracking-[-0.03em] ${
            onDark ? 'text-paper' : 'text-ink'
          }`}
        >
          TalentLens
        </span>
        {showMeta ? (
          <span
            className={`mt-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] ${
              onDark ? 'text-paper/45' : 'text-faint'
            }`}
          >
            {meta}
          </span>
        ) : null}
      </span>
    </Link>
  )
}

export default Wordmark
