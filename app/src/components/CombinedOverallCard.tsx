import { scoreColor } from '../lib/color'

interface CombinedOverallCardProps {
  value: number | null
  classAvg: number | null
  isClassView: boolean
}

export function CombinedOverallCard({ value, classAvg, isClassView }: CombinedOverallCardProps) {
  const delta = value !== null && classAvg !== null && !isClassView ? value - classAvg : null
  return (
    <div className="card">
      <h3>{isClassView ? 'Class overall' : 'Overall score'}</h3>
      {value === null ? (
        <p className="stat mono soft">n/a</p>
      ) : (
        <p className="stat" style={{ color: scoreColor(value) }}>
          {value.toFixed(1)}%
        </p>
      )}
      {delta !== null && (
        <p className={`soft mono delta ${delta >= 0 ? 'delta-pos' : 'delta-neg'}`}>
          {delta >= 0 ? '+' : ''}
          {delta.toFixed(1)} vs class avg
        </p>
      )}
    </div>
  )
}
