import type { AttendanceEntry, DashboardData } from '../types/dashboard'

/**
 * Class-wide attendance: the plain average of each field across every student who has an
 * attendance entry. Students with no entry (no data, or too few marked days to be meaningful --
 * see the pipeline's attendance.py) are simply excluded from the average, not counted as 0.
 */
export function classAttendance(data: DashboardData): AttendanceEntry | undefined {
  const entries = data.students
    .map((s) => data.attendance?.[s])
    .filter((e): e is AttendanceEntry => e !== undefined)

  if (entries.length === 0) return undefined

  const avg = (key: keyof AttendanceEntry) => entries.reduce((sum, e) => sum + e[key], 0) / entries.length

  return {
    attendancePct: avg('attendancePct'),
    presentPct: avg('presentPct'),
    onlinePct: avg('onlinePct'),
    absentPct: avg('absentPct'),
  }
}
