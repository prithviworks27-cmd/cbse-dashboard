// Mirrors /schemas/dashboard.schema.json. Keep in sync with the pipeline's pydantic models.
// This is the ONLY contract the UI depends on — components must be pure renderers of this shape.

export type Typology = 'Understanding / Remembering' | 'Applying' | 'Analysing'

export interface Question {
  test: string
  topic: string
  qno: string
  difficulty: string
  typology: string
  type: string
  score: number | null
  marks: number
  accuracy: number | null
}

export interface PriorityWeakness {
  topic: string
  typology: string
  difficulty: string
  accuracy: number
  marks: number
}

export interface TrendPoint {
  test: string
  accuracy: number | null
}

export interface StudentSubjectEntry {
  enrolled: boolean
  overall: number | null
  byTypology: Record<string, number>
  byDifficulty: Record<string, number>
  byType: Record<string, number>
  byTopic: Record<string, number>
  byTopicDifficulty: Record<string, Record<string, number>>
  trend: TrendPoint[]
  priority: PriorityWeakness[]
  questions: Question[]
}

export interface LeaderboardEntry {
  student: string
  testsTaken: number
  totalScore: number
  adjustedPct: number
  rank: number | null
}

export interface ClassAvg {
  byTypology: Record<string, number>
  byDifficulty: Record<string, number>
  byType: Record<string, number>
  overall: number
  submittedCount: number
  totalStudents: number
  totalTests: number
  totalMarksAllTests: number
}

export interface TrackingOnlyExtra {
  testOrder: string[]
  testLabels: Record<string, string>
  submissions: Record<string, string[]>
}

export interface ScoredSubject {
  classAvg: ClassAvg
  students: Record<string, StudentSubjectEntry>
  testOrder: string[]
  testLabels: Record<string, string>
  topics: string[]
  typologies: string[]
  leaderboard: LeaderboardEntry[]
  trackingOnlyExtra: TrackingOnlyExtra
}

export interface TrackingOnlySubject {
  testOrder: string[]
  testLabels: Record<string, string>
  submissions: Record<string, string[]>
}

export interface AttendanceEntry {
  attendancePct: number
  presentPct: number
  onlinePct: number
  absentPct: number
}

export interface CombinedOverall {
  classOverall: number | null
  students: Record<string, number | null>
}

export interface DashboardData {
  school: string
  className: string
  subjects: string[]
  subjectsWithScores: string[]
  students: string[]
  subjectEnrollment: Record<string, string[]>
  attendance?: Record<string, AttendanceEntry>
  syllabusProgress?: Record<string, number>
  scored: Record<string, ScoredSubject>
  trackingOnly: Record<string, TrackingOnlySubject>
  combinedOverall: CombinedOverall
}

/** The four distinct states a subject can be in for a given student — never collapse these. */
export type SubjectStatus = 'not-enrolled' | 'no-data' | 'tracking-only' | 'scored'

export function subjectStatus(data: DashboardData, subject: string, student: string): SubjectStatus {
  const enrolled = data.subjectEnrollment[student]?.includes(subject) ?? false
  if (!enrolled) return 'not-enrolled'
  const hasScored = subject in data.scored
  const hasTracking = subject in data.trackingOnly
  if (hasScored) return 'scored'
  if (hasTracking) return 'tracking-only'
  return 'no-data'
}
