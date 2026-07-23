export interface RadarPoint {
  skill: string
  accuracy: number
}

interface ProtractorRadarProps {
  data: RadarPoint[]
  compare?: RadarPoint[]
  size?: number
  title?: string
}

const RING_PCTS = [25, 50, 75, 100]

/**
 * Custom SVG "protractor" radar: tick marks like a real protractor along each spoke,
 * solid filled polygon for the student, dashed outline overlay for the comparison series
 * (typically class average). Not a stock chart-library radar.
 */
export function ProtractorRadar({ data, compare, size = 260, title }: ProtractorRadarProps) {
  const n = data.length
  const center = size / 2
  const radius = size * 0.34

  if (n === 0) {
    return <p className="mono radar-empty">No data yet.</p>
  }

  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2

  const pointFor = (i: number, pct: number): [number, number] => {
    const angle = angleFor(i)
    const r = (radius * Math.max(0, Math.min(100, pct))) / 100
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)]
  }

  const polygonPoints = (series: RadarPoint[]) =>
    series
      .map((s, i) => pointFor(i, s.accuracy).join(','))
      .join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" role="img" aria-label={title ?? 'radar chart'}>
      {RING_PCTS.map((t) => (
        <circle key={t} cx={center} cy={center} r={(radius * t) / 100} fill="none" stroke="var(--hairline)" strokeWidth={1} />
      ))}

      {data.map((d, i) => {
        const angle = angleFor(i)
        const [x2, y2] = pointFor(i, 100)
        const [lx, ly] = pointFor(i, 122)
        const tickLen = 4
        const perpX = -Math.sin(angle) * tickLen
        const perpY = Math.cos(angle) * tickLen
        return (
          <g key={d.skill}>
            <line x1={center} y1={center} x2={x2} y2={y2} stroke="var(--hairline)" strokeWidth={1} />
            {RING_PCTS.map((t) => {
              const [tx, ty] = pointFor(i, t)
              return (
                <line
                  key={t}
                  x1={tx - perpX}
                  y1={ty - perpY}
                  x2={tx + perpX}
                  y2={ty + perpY}
                  stroke="var(--ink-soft)"
                  strokeWidth={1}
                />
              )
            })}
            <text
              x={lx}
              y={ly}
              fontSize={10}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--ink-soft)"
              className="mono"
            >
              {d.skill}
            </text>
          </g>
        )
      })}

      {compare && compare.length === n && (
        <polygon
          points={polygonPoints(compare)}
          fill="none"
          stroke="var(--ink-soft)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
      )}

      <polygon points={polygonPoints(data)} fill="var(--good)" fillOpacity={0.22} stroke="var(--good)" strokeWidth={2} />
      {data.map((d, i) => {
        const [x, y] = pointFor(i, d.accuracy)
        return <circle key={d.skill} cx={x} cy={y} r={3} fill="var(--good)" />
      })}
    </svg>
  )
}
