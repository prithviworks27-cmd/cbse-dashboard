export interface LeaderboardInput {
  student: string
  marksScored: number
  testsTaken: number
}

export interface LeaderboardEntry {
  student: string
  testsTaken: number
  totalScore: number
  adjustedPct: number
  rank: number | null
}

/**
 * adjustedPct = marks scored across submitted tests / total possible marks across every
 * test in the subject (attempted or not). Skipped tests count as zero, deliberately, so a
 * student can't outrank someone who's attempted everything by acing one easy test.
 * Tie-break: more tests taken wins, then alphabetical for full determinism.
 */
export function buildLeaderboard(inputs: LeaderboardInput[], totalMarksPossible: number): LeaderboardEntry[] {
  const withPct = inputs.map((i) => ({
    student: i.student,
    testsTaken: i.testsTaken,
    totalScore: i.marksScored,
    adjustedPct: totalMarksPossible > 0 ? (i.marksScored / totalMarksPossible) * 100 : 0,
  }))

  const sorted = [...withPct].sort((a, b) => {
    if (b.adjustedPct !== a.adjustedPct) return b.adjustedPct - a.adjustedPct
    if (b.testsTaken !== a.testsTaken) return b.testsTaken - a.testsTaken
    return a.student.localeCompare(b.student)
  })

  let rank = 0
  return sorted.map((entry) => {
    if (entry.testsTaken === 0) return { ...entry, rank: null }
    rank += 1
    return { ...entry, rank }
  })
}
