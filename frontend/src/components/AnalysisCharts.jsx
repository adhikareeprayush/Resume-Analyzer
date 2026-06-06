import { useMemo } from 'react'
import Chart from 'react-apexcharts'
import AnalyzeCard from './AnalyzeCard'

const COLORS = {
  ink: '#111827',
  mint: '#71c1a7',
  coral: '#ee8a63',
  slate: '#9ca3af',
  paper: '#f7f5ef'
}

const baseChart = {
  chart: {
    fontFamily: 'Manrope, sans-serif',
    toolbar: { show: false },
    animations: { enabled: true, speed: 500 }
  },
  grid: {
    borderColor: 'rgba(17, 24, 39, 0.08)',
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

  const histogram = useMemo(() => buildHistogram(resumes), [resumes])
  const fitCounts = useMemo(() => buildFitCounts(resumes), [resumes])
  const fitTiers = analysis.summary?.fitTiers ?? DEFAULT_FIT_TIERS
  const fitLabels = fitTiers.map(fitTierLabel)
  const topShortlist = useMemo(() => resumes.slice(0, 12), [resumes])
  const scatterSample = useMemo(() => {
    if (resumes.length <= 25) return resumes
    const top = resumes.slice(0, 12)
    const mid = resumes.slice(Math.floor(resumes.length / 2) - 3, Math.floor(resumes.length / 2) + 3)
    const tail = resumes.slice(-6)
    const seen = new Set()
    return [...top, ...mid, ...tail].filter((resume) => {
      if (seen.has(resume.id)) return false
      seen.add(resume.id)
      return true
    })
  }, [resumes])

  const histogramOptions = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'bar' },
    colors: [COLORS.ink],
    plotOptions: {
      bar: {
        borderRadius: 8,
        columnWidth: '52%'
      }
    },
    dataLabels: {
      enabled: true,
      offsetY: -6,
      style: { fontSize: '11px', fontWeight: 600, colors: [COLORS.ink] }
    },
    xaxis: {
      categories: histogram.map((bin) => bin.label),
      title: { text: 'Match score band', style: { color: COLORS.slate, fontSize: '11px' } }
    },
    yaxis: {
      title: { text: 'Candidates', style: { color: COLORS.slate, fontSize: '11px' } },
      tickAmount: 4
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.2,
        gradientToColors: [COLORS.mint],
        opacityFrom: 0.95,
        opacityTo: 0.75
      }
    }
  }

  const histogramSeries = [{ name: 'Candidates', data: histogram.map((bin) => bin.count) }]

  const fitSeries = fitTiers.map((tier) => fitCounts[tier.label] ?? 0)

  const fitOptions = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'donut' },
    labels: fitLabels,
    colors: [COLORS.mint, COLORS.coral, COLORS.slate],
    legend: {
      position: 'bottom',
      fontSize: '12px',
      labels: { colors: COLORS.ink },
      formatter: (seriesName, opts) => {
        const count = opts.w.globals.series[opts.seriesIndex]
        const share = resumes.length ? Math.round((count / resumes.length) * 100) : 0
        return `${seriesName} — ${count} (${share}%)`
      }
    },
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
            total: {
              show: true,
              label: 'Candidates',
              fontSize: '13px',
              color: COLORS.ink,
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
        borderRadius: 6,
        barHeight: '70%',
        distributed: true
      }
    },
    colors: topShortlist.map((resume) => {
      if (resume.score >= 85) return COLORS.mint
      if (resume.score >= 75) return COLORS.coral
      return COLORS.slate
    }),
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value}%`,
      style: { fontSize: '11px', fontWeight: 600 }
    },
    xaxis: {
      max: 100,
      labels: { style: { fontSize: '11px' } }
    },
    yaxis: {
      categories: topShortlist.map((resume) => shortenName(resume.resumeName)),
      labels: { style: { fontSize: '11px' } }
    },
    legend: { show: false }
  }

  const shortlistSeries = [{ name: 'Match score', data: topShortlist.map((resume) => resume.score) }]

  const scatterOptions = {
    ...baseChart,
    chart: { ...baseChart.chart, type: 'scatter', zoom: { enabled: false } },
    colors: [COLORS.coral],
    markers: {
      size: 6,
      strokeWidth: 0,
      hover: { size: 9 }
    },
    xaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      title: { text: 'Skill coverage %', style: { color: COLORS.slate, fontSize: '11px' } }
    },
    yaxis: {
      min: 0,
      max: 100,
      tickAmount: 5,
      title: { text: 'Model match %', style: { color: COLORS.slate, fontSize: '11px' } }
    },
    annotations: {
      yaxis: [
        {
          y: analysis.summary?.avgScore ?? 0,
          borderColor: COLORS.mint,
          strokeDashArray: 4,
          label: {
            text: 'Avg match',
            style: { background: COLORS.paper, color: COLORS.ink, fontSize: '11px' }
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
      <AnalyzeCard
        label="Analytics"
        title="Charts appear after analysis"
        description="Run an analysis to see score distribution, model fit mix, and shortlist signals."
      />
    )
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <AnalyzeCard
        label="Score spread"
        title="How candidates cluster"
        description="Distribution of match scores across every uploaded resume — useful when screening large batches."
        delay={80}
      >
        <Chart options={histogramOptions} series={histogramSeries} type="bar" height={300} />
      </AnalyzeCard>

      <AnalyzeCard
        label="Model verdict"
        title="Fit mix from the classifier"
        description="Model labels each resume Good Fit, Potential Fit, or No Fit. Typical match score bands are shown in the legend."
        variant="accent"
        delay={150}
      >
        <Chart options={fitOptions} series={fitSeries} type="donut" height={300} />
        <ul className="mt-4 grid gap-2 border-t border-slate/15 pt-4 sm:grid-cols-3">
          {fitTiers.map((tier, index) => (
            <li
              key={tier.label}
              className="rounded-xl border border-slate/15 bg-paper/80 px-3 py-2 text-xs text-ink/75"
            >
              <span
                className="mr-2 inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor: [COLORS.mint, COLORS.coral, COLORS.slate][index]
                }}
              />
              <span className="font-semibold text-ink">{tier.label}</span>
              <span className="mt-0.5 block text-ink/60">Match score {tier.scoreRange}</span>
            </li>
          ))}
        </ul>
      </AnalyzeCard>

      <AnalyzeCard
        className="lg:col-span-2"
        label="Shortlist view"
        title="Top candidates by match score"
        description="Highest-ranked resumes in this run. Colors reflect score band: mint (85+), coral (75–84), slate (below 75)."
        delay={220}
      >
        <Chart options={shortlistOptions} series={shortlistSeries} type="bar" height={Math.max(280, topShortlist.length * 36)} />
      </AnalyzeCard>

      <AnalyzeCard
        className="lg:col-span-2"
        label="Coverage vs match"
        title="Skill alignment compared to model score"
        description="Each dot is a candidate (sampled when batches are large). Upper-right = strong skills and strong model fit."
        variant="highlight"
        delay={290}
      >
        <Chart options={scatterOptions} series={scatterSeries} type="scatter" height={380} />
      </AnalyzeCard>
    </section>
  )
}

export default AnalysisCharts
