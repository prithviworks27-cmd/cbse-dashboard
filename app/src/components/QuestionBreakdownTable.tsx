import { scoreColor } from '../lib/color'
import type { Question } from '../types/dashboard'

interface QuestionBreakdownTableProps {
  questions: Question[]
  testOrder: string[]
  testLabels: Record<string, string>
}

export function QuestionBreakdownTable({ questions, testOrder, testLabels }: QuestionBreakdownTableProps) {
  const testsWithQuestions = testOrder.filter((testId) => questions.some((q) => q.test === testId))

  if (testsWithQuestions.length === 0) {
    return <p className="mono">No question-level data yet.</p>
  }

  return (
    <div className="question-breakdown">
      {testsWithQuestions.map((testId) => {
        const rows = questions.filter((q) => q.test === testId)
        return (
          <details key={testId} className="card question-breakdown-test">
            <summary className="mono">
              {testLabels[testId] ?? testId} <span className="soft">({rows.length} questions)</span>
            </summary>
            <table className="mono question-table">
              <thead>
                <tr>
                  <th>Q.No</th>
                  <th>Topic</th>
                  <th>Difficulty</th>
                  <th>Typology</th>
                  <th>Type</th>
                  <th>Score</th>
                  <th>Marks</th>
                  <th>Accuracy</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((q) => (
                  <tr key={`${q.test}-${q.qno}`}>
                    <td>{q.qno}</td>
                    <td>{q.topic}</td>
                    <td>{q.difficulty}</td>
                    <td>{q.typology}</td>
                    <td>{q.type}</td>
                    <td>{q.score ?? '—'}</td>
                    <td>{q.marks}</td>
                    <td style={{ color: q.accuracy === null ? undefined : scoreColor(q.accuracy) }}>
                      {q.accuracy === null ? '—' : `${Math.round(q.accuracy)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        )
      })}
    </div>
  )
}
