import { scoreColor } from '../lib/color'

interface HeatmapProps {
  topics: string[]
  difficulties: string[]
  data: Record<string, Record<string, number>>
}

// Transposed relative to the underlying data: difficulties run down the rows (there are only a
// handful -- Easy/Medium/Hard) and topics run across the columns, so the table is wide and short
// instead of tall and narrow. The scroll wrapper lets it grow past the card width horizontally
// rather than squeezing topic names unreadably thin.
export function TopicDifficultyHeatmap({ topics, difficulties, data }: HeatmapProps) {
  if (topics.length === 0 || difficulties.length === 0) {
    return <p className="mono">No topic data yet.</p>
  }

  return (
    <div className="heatmap-scroll">
      <div className="heatmap" role="table" aria-label="topic by difficulty accuracy heatmap">
        <div className="heatmap-row heatmap-header" role="row">
          <div className="heatmap-cell heatmap-corner" />
          {topics.map((topic) => (
            <div key={topic} className="heatmap-cell heatmap-col-label mono" role="columnheader" title={topic}>
              {topic}
            </div>
          ))}
        </div>
        {difficulties.map((d) => (
          <div key={d} className="heatmap-row" role="row">
            <div className="heatmap-cell heatmap-row-label mono" role="rowheader">
              {d}
            </div>
            {topics.map((topic) => {
              const val = data[topic]?.[d]
              return (
                <div
                  key={topic}
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
    </div>
  )
}
