import { describe, it, expect } from 'vitest'
import { buildLeaderboard } from './leaderboard'

describe('buildLeaderboard', () => {
  it('ranks by adjustedPct against the full subject-wide possible marks, not just attempted marks', () => {
    const result = buildLeaderboard(
      [
        { student: 'Asha', marksScored: 90, testsTaken: 1 }, // acing one easy test
        { student: 'Vikram', marksScored: 150, testsTaken: 5 }, // attempted everything, lower single-test average
      ],
      200,
    )
    const asha = result.find((r) => r.student === 'Asha')!
    const vikram = result.find((r) => r.student === 'Vikram')!
    expect(vikram.adjustedPct).toBeGreaterThan(asha.adjustedPct)
    expect(result[0].student).toBe('Vikram')
  })

  it('tie-breaks equal adjustedPct by more tests taken', () => {
    const result = buildLeaderboard(
      [
        { student: 'Zara', marksScored: 100, testsTaken: 2 },
        { student: 'Ben', marksScored: 100, testsTaken: 4 },
      ],
      200,
    )
    expect(result[0].student).toBe('Ben')
  })

  it('tie-breaks equal adjustedPct and equal testsTaken alphabetically', () => {
    const result = buildLeaderboard(
      [
        { student: 'Zara', marksScored: 100, testsTaken: 2 },
        { student: 'Amit', marksScored: 100, testsTaken: 2 },
      ],
      200,
    )
    expect(result[0].student).toBe('Amit')
  })

  it('gives rank: null to students with zero submissions, never a numeric rank', () => {
    const result = buildLeaderboard(
      [
        { student: 'Rahul', marksScored: 0, testsTaken: 0 },
        { student: 'Priya', marksScored: 80, testsTaken: 1 },
      ],
      200,
    )
    const rahul = result.find((r) => r.student === 'Rahul')!
    expect(rahul.rank).toBeNull()
  })

  it('assigns sequential ranks only to non-zero students, in sorted order', () => {
    const result = buildLeaderboard(
      [
        { student: 'A', marksScored: 0, testsTaken: 0 },
        { student: 'B', marksScored: 180, testsTaken: 5 },
        { student: 'C', marksScored: 90, testsTaken: 3 },
      ],
      200,
    )
    expect(result.find((r) => r.student === 'B')!.rank).toBe(1)
    expect(result.find((r) => r.student === 'C')!.rank).toBe(2)
    expect(result.find((r) => r.student === 'A')!.rank).toBeNull()
  })
})
