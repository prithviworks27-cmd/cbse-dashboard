import type { DashboardData, LeaderboardEntry } from '../types/dashboard'
import { studentTestCounts } from './testCounts'

/**
 * Cross-subject leaderboard for the Overview page, ranked by each student's
 * combinedOverall percentage (marks scored / marks possible across every test they've
 * actually attempted, in every enrolled subject -- see combinedOverall's own docs for why
 * that's a different denominator than the per-subject leaderboard). Tie-break: more tests
 * taken (across all subjects) wins, then alphabetical for full determinism. Students with
 * no combinedOverall (zero attempts anywhere) get rank: null, same convention as the
 * per-subject leaderboard.
 */
export function buildCombinedLeaderboard(data: DashboardData): LeaderboardEntry[] {
  const rows = data.students.map((student) => ({
    student,
    overall: data.combinedOverall.students[student] ?? null,
    testsTaken: studentTestCounts(data, student).taken.length,
  }))

  const ranked = rows.filter((r): r is typeof r & { overall: number } => r.overall !== null)
  const unranked = rows.filter((r) => r.overall === null)

  ranked.sort((a, b) => b.overall - a.overall || b.testsTaken - a.testsTaken || a.student.localeCompare(b.student))
  unranked.sort((a, b) => a.student.localeCompare(b.student))

  const entries: LeaderboardEntry[] = ranked.map((r, i) => ({
    student: r.student,
    testsTaken: r.testsTaken,
    totalScore: 0,
    adjustedPct: r.overall,
    rank: i + 1,
  }))

  for (const r of unranked) {
    entries.push({ student: r.student, testsTaken: r.testsTaken, totalScore: 0, adjustedPct: 0, rank: null })
  }

  return entries
}
