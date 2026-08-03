interface RightWrongBarChartProps {
  correct: number
  wrong: number
  width?: number
  height?: number
}

// Square-ish default to match ProtractorRadar's viewBox (size=260) so this card reads as
// the same size when placed alongside the radar charts in a 2x2 grid.
export function RightWrongBarChart({ correct, wrong, width = 260, height = 260 }: RightWrongBarChartProps) {
  const attempted = correct + wrong
  if (attempted === 0) {
    return <p className="mono soft">No attempted questions yet.</p>
  }

  const bars = [
    { label: 'Correct', value: correct, color: 'var(--good)' },
    { label: 'Attempted', value: attempted, color: 'var(--ink-soft)' },
  ]

  const padding = { top: 8, right: 44, bottom: 8, left: 80 }
  const plotW = width - padding.left - padding.right
  const plotH = height - padding.top - padding.bottom
  const maxVal = Math.max(correct, attempted, 1)
  const slot = plotH / bars.length
  const barH = Math.min(48, slot * 0.55)

  const xFor = (v: number) => padding.left + (v / maxVal) * plotW

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="questions correct vs total attempted">
      <line
        x1={padding.left}
        x2={padding.left}
        y1={padding.top}
        y2={height - padding.bottom}
        stroke="var(--hairline)"
        strokeWidth={1}
      />
      {bars.map((b, i) => {
        const barW = (b.value / maxVal) * plotW
        const cy = padding.top + slot * i + slot / 2
        const y = cy - barH / 2
        const delay = i * 0.15

        return (
          <g key={b.label}>
            <text
              x={padding.left - 10}
              y={cy}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={12}
              className="mono"
              fill="var(--ink-soft)"
            >
              {b.label}
            </text>
            <rect x={padding.left} y={y} width={0} height={barH} fill={b.color} rx={4}>
              <animate
                attributeName="width"
                from="0"
                to={barW}
                dur="0.7s"
                begin={`${delay}s`}
                fill="freeze"
                calcMode="spline"
                keySplines="0.25 0.1 0.25 1"
                keyTimes="0;1"
              />
            </rect>
            <text
              x={xFor(b.value) + 8}
              y={cy}
              dominantBaseline="middle"
              fontSize={13}
              className="mono"
              fill="var(--ink)"
              opacity={0}
            >
              {b.value}
              <animate attributeName="opacity" from="0" to="1" dur="0.3s" begin={`${delay + 0.5}s`} fill="freeze" />
            </text>
          </g>
        )
      })}
    </svg>
  )
}
