import { useState } from 'react'
import { labelColumnHalfWidth } from '../lib/wrapLabel'
import { paperShortLabel, fitPaperLabelFontSize } from '../lib/paperLabel'
import type { TrendPoint } from '../types/dashboard'

interface TrendChartProps {
  points: TrendPoint[]
  testLabels: Record<string, string>
  width?: number
  height?: number
}

const Y_GRID = [0, 25, 50, 75, 100]

export function TrendChart({ points, testLabels, width = 640, height = 260 }: TrendChartProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [hovered, setHovered] = useState<number | null>(null)
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

  const shortLabels = points.map((p) => paperShortLabel(testLabels[p.test] ?? p.test, p.test))
  const columnSpacing = n <= 1 ? plotX1 - plotX0 : (plotX1 - plotX0) / (n - 1)
  const collapsedFontSize = fitPaperLabelFontSize(shortLabels, columnSpacing)
  const selectedLabel = expanded !== null ? testLabels[expanded] ?? expanded : null

  return (
    <div className="trend-chart">
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
          <g
            key={p.test}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(p.i)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Larger invisible hit area -- the visible dot is too small to hover precisely. */}
            <circle cx={xFor(p.i)} cy={yFor(p.accuracy as number)} r={10} fill="transparent" />
            <circle
              cx={xFor(p.i)}
              cy={yFor(p.accuracy as number)}
              r={hovered === p.i ? 5 : 3}
              fill="var(--good)"
              pointerEvents="none"
            />
          </g>
        ))}
        {points.map((p, i) => {
          if (p.accuracy === null) {
            return <circle key={`${p.test}-null`} cx={xFor(i)} cy={yFor(0)} r={2} fill="var(--hairline)" />
          }
          return null
        })}

        {points.map((p, i) => {
          const isSelected = expanded === p.test
          const x = xFor(i)
          return (
            <g
              key={p.test}
              onClick={() => setExpanded(isSelected ? null : p.test)}
              style={{ cursor: 'pointer' }}
            >
              <text
                x={x}
                y={height - padding.bottom + 14}
                fontSize={collapsedFontSize}
                fontWeight={isSelected ? 700 : undefined}
                textAnchor="middle"
                className="mono"
                fill={isSelected ? 'var(--ink)' : 'var(--ink-soft)'}
                textDecoration={isSelected ? undefined : 'underline'}
              >
                {shortLabels[i]}
              </text>
            </g>
          )
        })}

        {hovered !== null && (() => {
          const p = validPoints.find((vp) => vp.i === hovered)
          if (!p) return null
          const cx = xFor(p.i)
          const cy = yFor(p.accuracy as number)
          const label = `${shortLabels[p.i]}: ${Math.round(p.accuracy as number)}%`
          const fontSize = 11
          const boxW = label.length * fontSize * 0.62 + 16
          const boxH = 22
          const gap = 8
          const fitsAbove = cy - gap - boxH >= 0
          const boxY = fitsAbove ? cy - gap - boxH : cy + gap
          const boxX = Math.min(Math.max(cx - boxW / 2, 2), width - boxW - 2)
          return (
            <g pointerEvents="none">
              <line x1={cx} x2={cx} y1={padding.top} y2={height - padding.bottom} stroke="var(--ink-soft)" strokeWidth={1} strokeDasharray="3 3" />
              <line x1={padding.left} x2={width - padding.right} y1={cy} y2={cy} stroke="var(--ink-soft)" strokeWidth={1} strokeDasharray="3 3" />
              <rect x={boxX} y={boxY} width={boxW} height={boxH} rx={6} fill="var(--ink)" />
              <text
                x={boxX + boxW / 2}
                y={boxY + boxH / 2}
                fontSize={fontSize}
                textAnchor="middle"
                dominantBaseline="middle"
                className="mono"
                fill="var(--card)"
              >
                {label}
              </text>
            </g>
          )
        })()}
      </svg>
      {selectedLabel && <p className="mono trend-chart-caption">{selectedLabel}</p>}
    </div>
  )
}
