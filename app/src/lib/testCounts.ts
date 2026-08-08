import type { DashboardData } from '../types/dashboard'

export interface TestCounts {
  taken: string[]
  due: string[]
}

// Test labels follow a "<Chapter> Paper <N> - <description>" convention throughout the
// pipeline (e.g. "Motion in 1D Paper 3 - Accelerated Motion"), so the chapter name is
// reliably everything before " Paper ". Falls back to the whole label for anything that
// doesn't follow the convention, so it still sorts (just as its own single-item group).
function chapterOf(label: string): string {
  const idx = label.indexOf(' Paper ')
  return idx === -1 ? label : label.slice(0, idx)
}

function paperNumberOf(label: string): number {
  const match = label.match(/Paper\s+(\d+)/)
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY
}

// Groups same-chapter papers together (alphabetical by chapter), in paper-number order
// within a chapter, instead of raw pipeline registration order -- which otherwise
// interleaves chapters however tests happened to be registered (e.g. MCQ papers for
// every chapter, then that same chapter's subjective papers tacked on at the end).
function sortByChapter(labels: string[]): string[] {
  return [...labels].sort((a, b) => {
    const chapterCompare = chapterOf(a).localeCompare(chapterOf(b))
    if (chapterCompare !== 0) return chapterCompare
    const paperCompare = paperNumberOf(a) - paperNumberOf(b)
    if (paperCompare !== 0) return paperCompare
    return a.localeCompare(b)
  })
}

// A test counts as "taken" for a scored subject only if the student has at least one
// question row with a non-null score for it. The pipeline emits a question row for every
// test a student appears on the roster for, whether or not they actually submitted it --
// an unsubmitted test's rows all carry score: null, so row *existence* alone is not a
// reliable signal (a student can have rows for a test they never took at all).
//
// `subject`, when given, scopes the count to just that one subject -- used on subject
// pages so a multi-subject student's card doesn't also list other subjects' papers.
// Omitted (as on the cross-subject Overview page), it spans every enrolled subject.
export function studentTestCounts(data: DashboardData, student: string, subject?: string): TestCounts {
  const taken: string[] = []
  const due: string[] = []
  const allEnrolled = data.subjectEnrollment[student] ?? []
  const enrolledSubjects = subject ? allEnrolled.filter((s) => s === subject) : allEnrolled

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

  return { taken: sortByChapter(taken), due: sortByChapter(due) }
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
