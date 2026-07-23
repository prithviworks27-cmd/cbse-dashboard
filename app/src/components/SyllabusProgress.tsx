interface SyllabusProgressProps {
  progress: Record<string, number>
}

export function SyllabusProgress({ progress }: SyllabusProgressProps) {
  const subjects = Object.keys(progress)
  if (subjects.length === 0) {
    return null
  }
  return (
    <div className="card">
      <h3>Syllabus progress</h3>
      {subjects.map((subject) => (
        <div key={subject} className="syllabus-row">
          <span className="mono syllabus-label">{subject}</span>
          <div className="syllabus-bar-track">
            <div className="syllabus-bar-fill" style={{ width: `${Math.max(0, Math.min(100, progress[subject]))}%` }} />
          </div>
          <span className="mono syllabus-pct">{Math.round(progress[subject])}%</span>
        </div>
      ))}
    </div>
  )
}
