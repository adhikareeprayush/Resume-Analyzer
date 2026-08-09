import Chart from 'react-apexcharts'
import { Card } from '../components/ui'

/* Mirrors the @theme tokens in index.css so charts read as part of the system. */
const COLORS = {
  ink: '#0d1110',
  ok: '#0e6f5c',
  warn: '#9c6008',
  signal: '#c0350f',
  neutral: '#737d79',
  muted: '#59635f',
  paper: '#f2f3f1'
}

const BAND_COLORS = [COLORS.ok, COLORS.warn, COLORS.neutral]

const baseChart = {
  chart: {
    fontFamily: 'Geist, sans-serif',
    toolbar: { show: false },
    animations: { enabled: false }
  },
  grid: {
    borderColor: 'rgba(13, 17, 16, 0.08)',
    strokeDashArray: 4
  },
  tooltip: {
    theme: 'light'
  }
}

function buildHistogram(resumes) {
  const bins = [
    { label: '< 50', min: 0, max: 49 },
    { label: '50–64', min: 50, max: 64 },
    { label: '65–74', min: 65, max: 74 },
    { label: '75–84', min: 75, max: 84 },
    { label: '85+', min: 85, max: 100 }
  ]

  return bins.map((bin) => ({
    label: bin.label,
    count: resumes.filter((resume) => resume.score >= bin.min && resume.score <= bin.max).length
  }))
}

function buildFitCounts(resumes) {
  const counts = { 'Good Fit': 0, 'Potential Fit': 0, 'No Fit': 0 }
  resumes.forEach((resume) => {
    const label = resume.fitLabel || 'No Fit'
    if (counts[label] !== undefined) {
      counts[label] += 1
    } else {
      counts['No Fit'] += 1
    }
  })
  return counts
}

// Large batches would overplot, so keep the top, middle, and tail of the ranking.
function sampleForScatter(resumes) {
  if (resumes.length <= 25) return resumes

  const middle = Math.floor(resumes.length / 2)
  const picked = [...resumes.slice(0, 12), ...resumes.slice(middle - 3, middle + 3), ...resumes.slice(-6)]
  const seen = new Set()

  return picked.filter((resume) => {
    if (seen.has(resume.id)) return false
    seen.add(resume.id)
    return true
  })
}

function shortenName(name, max = 22) {
  if (!name) return 'Resume'
  return name.length > max ? `${name.slice(0, max - 3)}...` : name
}

const DEFAULT_FIT_TIERS = [
  { label: 'Good Fit', scoreRange: '85%+' },
  { label: 'Potential Fit', scoreRange: '75–84%' },
  { label: 'No Fit', scoreRange: 'Below 75%' }
]

function fitTierLabel(tier) {
  return `${tier.label} (${tier.scoreRange})`
}

function AnalysisCharts({ analysis }) {
  const resumes = analysis.rankedResumes || []

  const histogram = buildHistogram(resumes)
  const fitCounts = buildFitCounts(resumes)
  const fitTiers = analysis.summary?.fitTiers ?? DEFAULT_FIT_TIERS
  const fitLabels = fitTiers.map(fitTierLabel)
  const topShortlist = resumes.slice(0, 12)
  const scatterSample = sampleForScatter(resumes)

  const peakBin = Math.max(1, ...histogram.map((bin) => bin.count))

  const histogramOptions = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'bar' },
    colors: [COLORS.ink],
    plotOptions: {
      bar: {
        borderRadius: 3,
        columnWidth: '46%'
      }
    },
    dataLabels: { enabled: false },
    fill: { opacity: 1 },
    xaxis: {
      categories: histogram.map((bin) => bin.label),
      axisBorder: { color: 'rgba(13, 17, 16, 0.14)' },
      axisTicks: { color: 'rgba(13, 17, 16, 0.14)' },
      labels: { style: { colors: COLORS.muted, fontSize: '11px' } },
      title: { text: 'Match score band', style: { color: COLORS.muted, fontSize: '11px' } }
    },
    yaxis: {
      title: { text: 'Candidates', style: { color: COLORS.muted, fontSize: '11px' } },
      min: 0,
      max: peakBin,
      tickAmount: Math.min(peakBin, 5),
      labels: {
        style: { colors: COLORS.muted, fontSize: '11px' },
        formatter: (value) => `${Math.round(value)}`
      }
    }
  }

  const histogramSeries = [{ name: 'Candidates', data: histogram.map((bin) => bin.count) }]

  const fitSeries = fitTiers.map((tier) => fitCounts[tier.label] ?? 0)

  const fitOptions = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'donut' },
    labels: fitLabels,
    colors: BAND_COLORS,
    legend: { show: false },
    tooltip: {
      y: {
        formatter: (value, { seriesIndex }) => {
          const tier = fitTiers[seriesIndex]
          const count = fitSeries[seriesIndex]
          const share = resumes.length ? Math.round((count / resumes.length) * 100) : 0
          return `${count} candidates (${share}%) · typical match ${tier?.scoreRange ?? ''}`
        }
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '68%',
          labels: {
            show: true,
            value: {
              fontSize: '26px',
              fontWeight: 600,
              color: COLORS.ink
            },
            total: {
              show: true,
              label: 'Candidates',
              fontSize: '10px',
              fontFamily: 'Geist Mono, monospace',
              color: COLORS.muted,
              formatter: () => `${resumes.length}`
            }
          }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${Math.round(value)}%`
    }
  }

  const shortlistOptions = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'bar' },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 3,
        barHeight: '62%',
        distributed: true,
        dataLabels: { position: 'top' }
      }
    },
    colors: topShortlist.map((resume) => {
      if (resume.score >= 85) return COLORS.ok
      if (resume.score >= 75) return COLORS.warn
      return COLORS.neutral
    }),
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      offsetX: 8,
      formatter: (value) => `${value}%`,
      style: {
        fontSize: '11px',
        fontWeight: 500,
        fontFamily: 'Geist Mono, monospace',
        colors: topShortlist.map(() => COLORS.muted)
      }
    },
    xaxis: {
      categories: topShortlist.map((resume) => shortenName(resume.resumeName)),
      min: 0,
      max: 100,
      tickAmount: 5,
      axisBorder: { color: 'rgba(13, 17, 16, 0.14)' },
      axisTicks: { color: 'rgba(13, 17, 16, 0.14)' },
      labels: { style: { colors: COLORS.muted, fontSize: '11px' } },
      title: { text: 'Match score %', style: { color: COLORS.muted, fontSize: '11px' } }
    },
    yaxis: {
      labels: { style: { colors: COLORS.muted, fontSize: '11px' } }
    },
    legend: { show: false }
  }

  const shortlistSeries = [{ name: 'Match score', data: topShortlist.map((resume) => resume.score) }]

  const scatterOptions = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'scatter', zoom: { enabled: false } },
    colors: [COLORS.signal],
    grid: { ...baseChart.grid, padding: { left: 18, right: 12 } },
    markers: {
      size: 6,
      strokeWidth: 0,
      hover: { size: 9 }
    },
    xaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      axisBorder: { color: 'rgba(13, 17, 16, 0.14)' },
      axisTicks: { color: 'rgba(13, 17, 16, 0.14)' },
      labels: { style: { colors: COLORS.muted, fontSize: '11px' } },
      title: { text: 'Skill coverage %', style: { color: COLORS.muted, fontSize: '11px' } }
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      labels: { style: { colors: COLORS.muted, fontSize: '11px' } },
      title: { text: 'Model match %', style: { color: COLORS.muted, fontSize: '11px' } }
    },
    annotations: {
      yaxis: [
        {
          y: analysis.summary?.avgScore ?? 0,
          borderColor: 'rgba(13, 17, 16, 0.35)',
          strokeDashArray: 4,
          label: {
            text: `Avg match ${Math.round(analysis.summary?.avgScore ?? 0)}%`,
            position: 'left',
            offsetX: 78,
            borderColor: 'transparent',
            style: {
              background: COLORS.paper,
              color: COLORS.muted,
              fontSize: '10px',
              fontFamily: 'Geist Mono, monospace'
            }
          }
        }
      ]
    },
    tooltip: {
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const point = w.config.series[seriesIndex].data[dataPointIndex]
        return `<div class="px-3 py-2 text-xs"><strong>${point.name}</strong><br/>Match ${point.y}% · Skills ${point.x}%</div>`
      }
    }
  }

  const scatterSeries = [
    {
      name: 'Candidates',
      data: scatterSample.map((resume) => ({
        x: resume.keywordCoverage ?? 0,
        y: resume.score ?? 0,
        name: shortenName(resume.resumeName, 28)
      }))
    }
  ]

  if (resumes.length === 0) {
    return (
      <Card
        eyebrow="Analytics"
        title="Charts appear after analysis"
        description="Run an analysis to see score distribution, model fit mix, and shortlist signals."
      />
    )
  }

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card
        eyebrow="Score spread"
        title="How candidates cluster"
        description="Distribution of match scores across every uploaded resume — useful when screening large batches."
      >
        <Chart options={histogramOptions} series={histogramSeries} type="bar" height={300} />
      </Card>

      <Card
        eyebrow="Model verdict"
        title="Fit mix from the classifier"
        description="Model labels each resume Good Fit, Potential Fit, or No Fit. Typical match score bands are shown below."
        variant="inset"
      >
        <Chart options={fitOptions} series={fitSeries} type="donut" height={300} />
        <ul className="mt-5 grid gap-4 border-t border-ink/10 pt-5 sm:grid-cols-3">
          {fitTiers.map((tier, index) => (
            <li key={tier.label} className="text-xs">
              <span className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: BAND_COLORS[index] }}
                />
                <span className="font-medium text-ink">{tier.label}</span>
              </span>
              <span className="readout mt-1.5 block text-ink">
                {fitCounts[tier.label] ?? 0}
                <span className="text-faint"> / {resumes.length}</span>
              </span>
              <span className="readout mt-0.5 block text-faint">{tier.scoreRange}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card
        className="lg:col-span-2"
        eyebrow="Shortlist view"
        title="Top candidates by match score"
        description="Highest-ranked resumes in this run. Bar colour follows the score band: green (85+), amber (75–84), grey (below 75)."
      >
        <Chart options={shortlistOptions} series={shortlistSeries} type="bar" height={Math.max(280, topShortlist.length * 36)} />
      </Card>

      <Card
        className="lg:col-span-2"
        eyebrow="Coverage vs match"
        title="Skill alignment compared to model score"
        description="Each dot is a candidate (sampled when batches are large). Upper-right = strong skills and strong model fit."
        variant="flat"
      >
        <Chart options={scatterOptions} series={scatterSeries} type="scatter" height={380} />
      </Card>
    </section>
  )
}

export default AnalysisCharts
