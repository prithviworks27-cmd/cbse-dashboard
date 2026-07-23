import type { DashboardData } from '../types/dashboard'

/** The four distinct states a subject can be in for a given student — never collapse these. */
export type SubjectStatus = 'not-enrolled' | 'no-data' | 'tracking-only' | 'scored'

export function subjectStatus(data: DashboardData, subject: string, student: string): SubjectStatus {
  const enrolled = data.subjectEnrollment[student]?.includes(subject) ?? false
  if (!enrolled) return 'not-enrolled'
  if (subject in data.scored) return 'scored'
  if (subject in data.trackingOnly) return 'tracking-only'
  return 'no-data'
}

export interface SubjectSnapshot {
  status: SubjectStatus
  label: string
  scorePct: number | null
}

/** Text shown on the Overview per-subject snapshot card. Each status has distinct wording. */
export function subjectSnapshotLabel(status: SubjectStatus, scorePct: number | null): string {
  switch (status) {
    case 'not-enrolled':
      return 'Not enrolled'
    case 'no-data':
      return 'No record updated yet'
    case 'tracking-only':
      return 'Tests tracked, no scores yet'
    case 'scored':
      return scorePct === null ? 'No submissions yet' : `${Math.round(scorePct)}%`
  }
}

export function subjectSnapshot(data: DashboardData, subject: string, student: string): SubjectSnapshot {
  const status = subjectStatus(data, subject, student)
  const scorePct = status === 'scored' ? (data.scored[subject]?.students[student]?.overall ?? null) : null
  return { status, label: subjectSnapshotLabel(status, scorePct), scorePct }
}

/** Filters a subject's enrolled students out of the full roster — the gate every subject-scoped aggregate must pass through. */
export function enrolledStudents(data: DashboardData, subject: string): string[] {
  return data.students.filter((s) => data.subjectEnrollment[s]?.includes(subject))
}
