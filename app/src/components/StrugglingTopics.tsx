import { scoreColor } from '../lib/color'
import { paperShortLabel } from '../lib/paperLabel'
import { groupQuestionsByChapter } from '../lib/priorityByChapter'
import { worstQuestions } from '../lib/worstQuestions'
import type { Question } from '../types/dashboard'

interface StrugglingTopicsProps {
  questions: Question[]
  testLabels: Record<string, string>
}

export function StrugglingTopics({ questions, testLabels }: StrugglingTopicsProps) {
  const worst = worstQuestions(questions)

  if (worst.length === 0) {
    return <p className="mono soft">No specific weak areas identified yet.</p>
  }

  const groups = groupQuestionsByChapter(worst)

  return (
    <div className="struggling-topics">
      {groups.map(({ chapter, items }) => (
        <div key={chapter} className="struggling-chapter">
          <h4 className="mono">{chapter}</h4>
          <ul className="struggling-list">
            {items.map((q) => (
              <li key={`${q.test}-${q.qno}`} className="struggling-item">
                <div className="struggling-item-text">
                  <div className="struggling-topic">{paperShortLabel(testLabels[q.test] ?? q.test, q.test)}</div>
                  <div className="soft mono struggling-meta">Question {q.qno}</div>
                </div>
                <span
                  className="mono struggling-accuracy"
                  style={{ backgroundColor: scoreColor(q.accuracy), color: 'var(--card)' }}
                >
                  {Math.round(q.accuracy)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
