import { useState } from 'react'

interface TestsCountCardProps {
  taken: number | string
  due: number | string
  takenList: string[]
  dueList: string[]
  isAverage: boolean
}

export function TestsCountCard({ taken, due, takenList, dueList, isAverage }: TestsCountCardProps) {
  const [takenOpen, setTakenOpen] = useState(false)
  const [dueOpen, setDueOpen] = useState(false)

  return (
    <>
      <div className="card">
        <h3>Tests Taken</h3>
        <button type="button" className="tests-count-stat" onClick={() => setTakenOpen((v) => !v)}>
          <span className="stat-pill stat-pill-good">{taken}</span>
          {isAverage && <span className="soft mono stat-pill-caption">average</span>}
        </button>
        {takenOpen && (
          <ul className="mono test-list">
            {takenList.length === 0 ? <li className="soft">None yet.</li> : takenList.map((t) => <li key={t}>{t}</li>)}
          </ul>
        )}
      </div>
      <div className="card">
        <h3>Tests Due</h3>
        <button type="button" className="tests-count-stat" onClick={() => setDueOpen((v) => !v)}>
          <span className="stat-pill stat-pill-bad">{due}</span>
          {isAverage && <span className="soft mono stat-pill-caption">average</span>}
        </button>
        {dueOpen && (
          <ul className="mono test-list">
            {dueList.length === 0 ? <li className="soft">Nothing due.</li> : dueList.map((t) => <li key={t}>{t}</li>)}
          </ul>
        )}
      </div>
    </>
  )
}
