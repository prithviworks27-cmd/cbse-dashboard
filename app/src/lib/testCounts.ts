import type { DashboardData } from '../types/dashboard'

export interface TestCounts {
  taken: string[]
  due: string[]
}

// A test counts as "taken" for a scored subject only if the student has at least one
// question row with a non-null score for it. The pipeline emits a question row for every
// test a student appears on the roster for, whether or not they actually submitted it --
// an unsubmitted test's rows all carry score: null, so row *existence* alone is not a
// reliable signal (a student can have rows for a test they never took at all).
export function studentTestCounts(data: DashboardData, student: string): TestCounts {
  const taken: string[] = []
  const due: string[] = []
  const enrolledSubjects = data.subjectEnrollment[student] ?? []

  for (const subject of enrolledSubjects) {
    const scored = data.scored[subject]
    if (scored) {
      const questions = scored.students[student]?.questions ?? []
      const submittedTestIds = new Set(questions.filter((q) => q.score !== null).map((q) => q.test))
      for (const testId of scored.testOrder) {
        const label = scored.testLabels[testId] ?? testId
        ;(submittedTestIds.has(testId) ? taken : due).push(label)
      }
      for (const testId of scored.trackingOnlyExtra.testOrder) {
        const label = scored.trackingOnlyExtra.testLabels[testId] ?? testId
        const submitted = scored.trackingOnlyExtra.submissions[student]?.includes(testId) ?? false
        ;(submitted ? taken : due).push(label)
      }
    }

    const tracking = data.trackingOnly[subject]
    if (tracking) {
      for (const testId of tracking.testOrder) {
        const label = tracking.testLabels[testId] ?? testId
        const submitted = tracking.submissions[student]?.includes(testId) ?? false
        ;(submitted ? taken : due).push(label)
      }
    }
  }

  return { taken, due }
}

export interface ClassTestCounts {
  avgTaken: number
  avgDue: number
  perStudent: Record<string, TestCounts>
}

export function classTestCounts(data: DashboardData): ClassTestCounts {
  const perStudent: Record<string, TestCounts> = {}
  for (const student of data.students) {
    perStudent[student] = studentTestCounts(data, student)
  }
  const n = data.students.length || 1
  const avgTaken = data.students.reduce((sum, s) => sum + perStudent[s].taken.length, 0) / n
  const avgDue = data.students.reduce((sum, s) => sum + perStudent[s].due.length, 0) / n
  return { avgTaken, avgDue, perStudent }
}
