import type { AttendanceEntry } from '../types/dashboard'

interface AttendanceCardProps {
  entry: AttendanceEntry | undefined
}

export function AttendanceCard({ entry }: AttendanceCardProps) {
  if (!entry) {
    return (
      <div className="card">
        <h3>Attendance</h3>
        <p className="mono soft">No attendance data.</p>
      </div>
    )
  }
  return (
    <div className="card">
      <h3>Attendance</h3>
      <p className="stat">{Math.round(entry.attendancePct)}%</p>
      <p className="soft mono">
        {Math.round(entry.presentPct)}% present · {Math.round(entry.onlinePct)}% online · {Math.round(entry.absentPct)}% absent
      </p>
    </div>
  )
}
