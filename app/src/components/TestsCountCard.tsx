import { useState } from 'react'

interface TestsCountCardProps {
  taken: number | string
  due: number | string
  takenList: string[]
  dueList: string[]
  isAverage: boolean
}

export function TestsCountCard({ taken, due, takenList, dueList, isAverage }: TestsCountCardProps) {
  const [expanded, setExpanded] = useState<'taken' | 'due' | null>(null)

  return (
    <div className="card">
      <h3>Tests {isAverage ? '(avg per student)' : 'taken / due'}</h3>
      <div className="tests-count-row">
        <button type="button" className="tests-count-stat" onClick={() => setExpanded(expanded === 'taken' ? null : 'taken')}>
          <span className="stat">{taken}</span>
          <span className="soft mono">taken</span>
        </button>
        <button type="button" className="tests-count-stat" onClick={() => setExpanded(expanded === 'due' ? null : 'due')}>
          <span className="stat">{due}</span>
          <span className="soft mono">due</span>
        </button>
      </div>
      {expanded === 'taken' && (
        <ul className="mono test-list">
          {takenList.length === 0 ? <li className="soft">None yet.</li> : takenList.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}
      {expanded === 'due' && (
        <ul className="mono test-list">
          {dueList.length === 0 ? <li className="soft">Nothing due.</li> : dueList.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}
    </div>
  )
}
