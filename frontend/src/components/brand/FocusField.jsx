const VIEW_W = 1600
const VIEW_H = 900
const LENS_R = 150

// Deterministic pseudo-random so the field never shifts between renders.
function noise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/** Unsorted candidates: granular dust across the plane, brighter near the lens. */
function buildDust({ focusX, focusY }) {
  const dust = []
  const cols = 64
  const rows = 34
  const stepX = VIEW_W / cols
  const stepY = VIEW_H / rows

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const seed = row * cols + col + 1
      const x = col * stepX + stepX / 2 + (noise(seed) - 0.5) * stepX * 0.8
      const y = row * stepY + stepY / 2 + (noise(seed + 991) - 0.5) * stepY * 0.8

      const dx = x - focusX
      const dy = y - focusY
      const radius = Math.sqrt(dx * dx + dy * dy)
      if (radius < LENS_R + 26) continue

      const spread = Math.sqrt((dx / (VIEW_W * 0.46)) ** 2 + (dy / (VIEW_H * 0.62)) ** 2)
      if (spread > 1.25) continue

      const nearness = Math.max(0, 1 - spread / 1.25) ** 1.5
      const height = 2 + nearness * 6 + noise(seed + 17) * 2

      dust.push({
        key: `d-${seed}`,
        x,
        y: y - height / 2,
        height,
        opacity: 0.05 + nearness * 0.42
      })
    }
  }

  return dust
}

/** Resolved candidates: a ranked readout sitting inside the lens. */
function buildRanking({ focusX, focusY }) {
  const count = 9
  const gap = 18
  const maxWidth = 152
  const left = focusX - 76
  const top = focusY - ((count - 1) * gap) / 2

  return Array.from({ length: count }, (_, i) => {
    const decay = 1 - i * 0.085
    const width = Math.max(18, maxWidth * (decay - noise(i + 5) * 0.08))
    return {
      key: `r-${i}`,
      x: left,
      y: top + i * gap - 2,
      width,
      delay: 420 + i * 70,
      hot: i === 0
    }
  })
}

/**
 * Full-bleed hero plane visual: scattered candidates on the outside, a ranked
 * shortlist resolved inside the lens. The parent owns the dark background and
 * any text scrim.
 */
const FOCUS_POINTS = {
  right: { x: 0.7, y: 0.46 },
  center: { x: 0.5, y: 0.4 },
  upper: { x: 0.5, y: 0.26 }
}

function FocusField({ focus = 'right', className = '' }) {
  const point = FOCUS_POINTS[focus] || FOCUS_POINTS.right
  const focusX = VIEW_W * point.x
  const focusY = VIEW_H * point.y
  const dust = buildDust({ focusX, focusY })
  const ranking = buildRanking({ focusX, focusY })

  const rings = [
    { r: LENS_R, opacity: 0.5, width: 1.5 },
    { r: 236, opacity: 0.24, width: 1 },
    { r: 352, opacity: 0.13, width: 1 },
    { r: 492, opacity: 0.07, width: 1 }
  ]

  return (
    <svg
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`.trim()}
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="tl-lens-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f2603a" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#4fd1b0" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#4fd1b0" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx={focusX} cy={focusY} r={520} fill="url(#tl-lens-glow)" />

      <g>
        {dust.map((mark) => (
          <rect
            key={mark.key}
            x={mark.x}
            y={mark.y}
            width={2}
            height={mark.height}
            rx={1}
            fill="#e8efec"
            opacity={mark.opacity}
          />
        ))}
      </g>

      <g
        className="animate-aperture"
        style={{ transformOrigin: `${focusX}px ${focusY}px`, animationDelay: '140ms' }}
      >
        {rings.map((ring) => (
          <circle
            key={ring.r}
            cx={focusX}
            cy={focusY}
            r={ring.r}
            fill="none"
            stroke="#e8efec"
            strokeWidth={ring.width}
            opacity={ring.opacity}
          />
        ))}

        {[0, 90, 180, 270].map((angle) => {
          const rad = (angle * Math.PI) / 180
          return (
            <line
              key={angle}
              x1={focusX + Math.cos(rad) * (LENS_R - 22)}
              y1={focusY + Math.sin(rad) * (LENS_R - 22)}
              x2={focusX + Math.cos(rad) * (LENS_R + 26)}
              y2={focusY + Math.sin(rad) * (LENS_R + 26)}
              stroke="#f2603a"
              strokeWidth={1.5}
              opacity={0.7}
            />
          )
        })}
      </g>

      <g>
        {ranking.map((bar) => (
          <rect
            key={bar.key}
            className="svg-grow"
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={4}
            rx={2}
            fill={bar.hot ? '#f2603a' : '#e8efec'}
            opacity={bar.hot ? 0.95 : 0.62}
            style={{ animationDelay: `${bar.delay}ms` }}
          />
        ))}
      </g>
    </svg>
  )
}

export default FocusField
