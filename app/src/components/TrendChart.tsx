import { labelColumnHalfWidth, wrapChartLabel } from '../lib/wrapLabel'
import type { TrendPoint } from '../types/dashboard'

interface TrendChartProps {
  points: TrendPoint[]
  testLabels: Record<string, string>
  width?: number
  height?: number
}

const Y_GRID = [0, 25, 50, 75, 100]

export function TrendChart({ points, testLabels, width = 640, height = 260 }: TrendChartProps) {
  const padding = { top: 16, right: 20, bottom: 60, left: 34 }
  const plotH = height - padding.top - padding.bottom
  const n = points.length

  if (n === 0) {
    return <p className="mono">No tests recorded yet.</p>
  }

  // Inset the first/last label columns by half their own width so a centered label at the
  // extremes can never overflow past the chart edge and get clipped (SVG root clips by default).
  const sideMargin = labelColumnHalfWidth(n) + 4
  const plotX0 = padding.left + sideMargin
  const plotX1 = width - padding.right - sideMargin

  const xFor = (i: number) => (n <= 1 ? (plotX0 + plotX1) / 2 : plotX0 + ((plotX1 - plotX0) * i) / (n - 1))
  const yFor = (pct: number) => padding.top + plotH * (1 - pct / 100)

  const validPoints = points.map((p, i) => ({ ...p, i })).filter((p) => p.accuracy !== null)
  const pathD = validPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${xFor(p.i)} ${yFor(p.accuracy as number)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="score trend across tests">
      {Y_GRID.map((pct) => (
        <g key={pct}>
          <line x1={padding.left} x2={width - padding.right} y1={yFor(pct)} y2={yFor(pct)} stroke="var(--hairline)" strokeWidth={1} />
          <text x={padding.left - 8} y={yFor(pct)} fontSize={9} textAnchor="end" dominantBaseline="middle" className="mono" fill="var(--ink-soft)">
            {pct}
          </text>
        </g>
      ))}

      {pathD && <path d={pathD} fill="none" stroke="var(--good)" strokeWidth={2} />}
      {validPoints.map((p) => (
        <circle key={p.test} cx={xFor(p.i)} cy={yFor(p.accuracy as number)} r={3} fill="var(--good)" />
      ))}
      {points.map((p, i) => {
        if (p.accuracy === null) {
          return <circle key={`${p.test}-null`} cx={xFor(i)} cy={yFor(0)} r={2} fill="var(--hairline)" />
        }
        return null
      })}

      {points.map((p, i) => {
        const { lines, fontSize } = wrapChartLabel(testLabels[p.test] ?? p.test, n)
        const x = xFor(i)
        const lineHeight = fontSize + 2
        return (
          <g key={p.test}>
            {lines.map((line, li) => (
              <text
                key={li}
                x={x}
                y={height - padding.bottom + 14 + li * lineHeight}
                fontSize={fontSize}
                textAnchor="middle"
                className="mono"
                fill="var(--ink-soft)"
              >
                {line}
              </text>
            ))}
          </g>
        )
      })}
    </svg>
  )
}
