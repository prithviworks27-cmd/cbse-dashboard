import { scoreColor } from '../lib/color'
import { classStrugglingTopics } from '../lib/classStrugglingTopics'

interface ClassStrugglingTopicsProps {
  byTopic: Record<string, number>
}

export function ClassStrugglingTopics({ byTopic }: ClassStrugglingTopicsProps) {
  const weak = classStrugglingTopics(byTopic)

  if (weak.length === 0) {
    return <p className="mono soft">No class-wide weak topics identified.</p>
  }

  return (
    <ul className="struggling-list">
      {weak.map((w) => (
        <li key={w.topic} className="struggling-item">
          <div className="struggling-item-text">
            <div className="struggling-topic">{w.topic}</div>
          </div>
          <span
            className="mono struggling-accuracy"
            style={{ backgroundColor: scoreColor(w.accuracy), color: 'var(--card)' }}
          >
            {Math.round(w.accuracy)}%
          </span>
        </li>
      ))}
    </ul>
  )
}
