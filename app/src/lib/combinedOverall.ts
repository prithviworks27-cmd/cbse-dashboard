export interface AttemptedTest {
  marksScored: number
  marksPossible: number
}

/**
 * Combined cross-subject overall for the Overview headline number. Deliberately different
 * from the leaderboard formula: divides only by what the student actually attempted, not
 * the full subject-wide pool — otherwise a student who's done 3 of 43 possible tests looks
 * artificially terrible on the one number a tutor sees first. Zero attempts anywhere -> null.
 */
export function combinedOverallForStudent(attempts: AttemptedTest[]): number | null {
  if (attempts.length === 0) return null
  const scored = attempts.reduce((sum, a) => sum + a.marksScored, 0)
  const possible = attempts.reduce((sum, a) => sum + a.marksPossible, 0)
  if (possible === 0) return null
  return (scored / possible) * 100
}

export function classCombinedOverall(perStudent: Array<number | null>): number | null {
  const values = perStudent.filter((v): v is number => v !== null)
  if (values.length === 0) return null
  return values.reduce((a, b) => a + b, 0) / values.length
}
