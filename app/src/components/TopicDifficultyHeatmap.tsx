import { scoreColor } from '../lib/color'

interface HeatmapProps {
  topics: string[]
  difficulties: string[]
  data: Record<string, Record<string, number>>
}

export function TopicDifficultyHeatmap({ topics, difficulties, data }: HeatmapProps) {
  if (topics.length === 0 || difficulties.length === 0) {
    return <p className="mono">No topic data yet.</p>
  }

  return (
    <div className="heatmap" role="table" aria-label="topic by difficulty accuracy heatmap">
      <div className="heatmap-row heatmap-header" role="row">
        <div className="heatmap-cell heatmap-corner" />
        {difficulties.map((d) => (
          <div key={d} className="heatmap-cell heatmap-col-label mono" role="columnheader">
            {d}
          </div>
        ))}
      </div>
      {topics.map((topic) => (
        <div key={topic} className="heatmap-row" role="row">
          <div className="heatmap-cell heatmap-row-label mono" role="rowheader" title={topic}>
            {topic}
          </div>
          {difficulties.map((d) => {
            const val = data[topic]?.[d]
            return (
              <div
                key={d}
                className="heatmap-cell heatmap-value mono"
                role="cell"
                style={{ background: val === undefined ? 'var(--hairline)' : scoreColor(val) }}
                title={val === undefined ? 'No data' : `${Math.round(val)}%`}
              >
                {val === undefined ? '—' : `${Math.round(val)}%`}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
