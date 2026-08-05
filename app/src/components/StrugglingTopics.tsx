import { scoreColor } from '../lib/color'
import { groupPriorityByChapter } from '../lib/priorityByChapter'
import type { PriorityWeakness } from '../types/dashboard'

interface StrugglingTopicsProps {
  priority: PriorityWeakness[]
}

export function StrugglingTopics({ priority }: StrugglingTopicsProps) {
  if (priority.length === 0) {
    return <p className="mono soft">No specific weak areas identified yet.</p>
  }

  const groups = groupPriorityByChapter(priority)

  return (
    <div className="struggling-topics">
      {groups.map(({ chapter, items }) => (
        <div key={chapter} className="struggling-chapter">
          <h4 className="mono">{chapter}</h4>
          <ul className="struggling-list">
            {items.map((p, i) => (
              <li key={i} className="struggling-item">
                <span className="struggling-topic">{p.topic}</span>
                <span className="soft mono struggling-meta">
                  {p.typology} · {p.difficulty}
                </span>
                <span
                  className="mono struggling-accuracy"
                  style={{ backgroundColor: scoreColor(p.accuracy), color: 'var(--card)' }}
                >
                  {Math.round(p.accuracy)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
