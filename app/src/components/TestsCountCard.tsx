import { useEffect, useRef, useState } from 'react'

interface TestsCountCardProps {
  taken: number | string
  due: number | string
  takenList: string[]
  dueList: string[]
  isAverage: boolean
}

interface TestsCountDropdownProps {
  label: string
  pillClass: 'stat-pill-good' | 'stat-pill-bad'
  value: number | string
  list: string[]
  isAverage: boolean
  emptyText: string
}

function TestsCountDropdown({ label, pillClass, value, list, isAverage, emptyText }: TestsCountDropdownProps) {
  const [open, setOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // Clicking anywhere outside the card closes the dropdown, same as a normal <select>.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // A class-wide average has no concrete per-test list behind it, so that card is a plain
  // static display -- only a specific student's card (a real list of tests) is a dropdown.
  if (isAverage) {
    return (
      <div className="card tests-count-card">
        <h3>{label}</h3>
        <span className={`stat-pill ${pillClass}`}>{value}</span>
        <span className="soft mono stat-pill-caption">average</span>
      </div>
    )
  }

  return (
    <div
      className="card tests-count-card tests-count-card-interactive"
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen((v) => !v)
        }
      }}
    >
      <h3>{label}</h3>
      <span className="tests-count-stat-row">
        <span className={`stat-pill ${pillClass}`}>{value}</span>
        <span className={`tests-count-chevron${open ? ' tests-count-chevron-open' : ''}`} aria-hidden="true">
          ▾
        </span>
      </span>
      {open && (
        <div className="tests-count-dropdown" onClick={(e) => e.stopPropagation()}>
          {list.length === 0 ? (
            <p className="soft mono">{emptyText}</p>
          ) : (
            <ul className="tests-count-pill-list mono">
              {list.map((t) => (
                <li key={t} className="tests-count-pill">
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function TestsCountCard({ taken, due, takenList, dueList, isAverage }: TestsCountCardProps) {
  return (
    <>
      <TestsCountDropdown
        label="Tests Taken"
        pillClass="stat-pill-good"
        value={taken}
        list={takenList}
        isAverage={isAverage}
        emptyText="None yet."
      />
      <TestsCountDropdown
        label="Tests Due"
        pillClass="stat-pill-bad"
        value={due}
        list={dueList}
        isAverage={isAverage}
        emptyText="Nothing due."
      />
    </>
  )
}
