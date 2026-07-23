import { scoreColor } from '../lib/color'
import { subjectSnapshot, subjectSnapshotLabel } from '../lib/enrollment'
import type { DashboardData } from '../types/dashboard'

interface SubjectSnapshotCardProps {
  data: DashboardData
  subject: string
  student: string | null // null = "All Students" class-wide view
}

export function SubjectSnapshotCard({ data, subject, student }: SubjectSnapshotCardProps) {
  if (student) {
    const snapshot = subjectSnapshot(data, subject, student)
    return (
      <div className="card subject-snapshot">
        <h3>{subject}</h3>
        <p className="stat" style={{ color: snapshot.scorePct !== null ? scoreColor(snapshot.scorePct) : 'var(--ink-soft)' }}>
          {snapshot.label}
        </p>
      </div>
    )
  }

  // All Students: show class average if scored, otherwise submission coverage, otherwise state label.
  const scored = data.scored[subject]
  const tracking = data.trackingOnly[subject]
  const enrolledCount = data.students.filter((s) => data.subjectEnrollment[s]?.includes(subject)).length

  if (scored) {
    return (
      <div className="card subject-snapshot">
        <h3>{subject}</h3>
        <p className="stat" style={{ color: scoreColor(scored.classAvg.overall) }}>
          {Math.round(scored.classAvg.overall)}%
        </p>
        <p className="soft mono">class average · {enrolledCount} enrolled</p>
      </div>
    )
  }

  if (tracking) {
    const submittedTotal = Object.values(tracking.submissions).reduce((sum, arr) => sum + arr.length, 0)
    const possibleTotal = enrolledCount * tracking.testOrder.length
    return (
      <div className="card subject-snapshot">
        <h3>{subject}</h3>
        <p className="stat mono">{subjectSnapshotLabel('tracking-only', null)}</p>
        <p className="soft mono">
          {submittedTotal}/{possibleTotal} submissions
        </p>
      </div>
    )
  }

  return (
    <div className="card subject-snapshot">
      <h3>{subject}</h3>
      <p className="stat mono soft">{enrolledCount === 0 ? subjectSnapshotLabel('not-enrolled', null) : subjectSnapshotLabel('no-data', null)}</p>
    </div>
  )
}
