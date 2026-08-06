import { describe, it, expect } from 'vitest'
import { buildCombinedLeaderboard } from './combinedLeaderboard'
import type { DashboardData } from '../types/dashboard'

function baseData(): DashboardData {
  return {
    school: 'Test School',
    className: 'X',
    subjects: ['Science'],
    subjectsWithScores: ['Science'],
    students: ['Asha', 'Rahul', 'Priya', 'Zoe'],
    subjectEnrollment: {
      Asha: ['Science'], Rahul: ['Science'], Priya: ['Science'], Zoe: ['Science'],
    },
    scored: {
      Science: {
        classAvg: { byTypology: {}, byDifficulty: {}, byType: {}, byTopic: {}, overall: 70, submittedCount: 3, totalStudents: 4, totalTests: 2, totalMarksAllTests: 100 },
        students: {
          Asha: { enrolled: true, overall: 80, byTypology: {}, byDifficulty: {}, byType: {}, byTopic: {}, byTopicDifficulty: {}, trend: [], priority: [],
            questions: [{ test: 't1', topic: 'T', qno: 'Q1', difficulty: 'Easy', typology: 'Applying', type: 'MCQ', score: 1, marks: 1, accuracy: 100 }] },
          Rahul: { enrolled: true, overall: 60, byTypology: {}, byDifficulty: {}, byType: {}, byTopic: {}, byTopicDifficulty: {}, trend: [], priority: [],
            questions: [{ test: 't1', topic: 'T', qno: 'Q1', difficulty: 'Easy', typology: 'Applying', type: 'MCQ', score: 1, marks: 1, accuracy: 100 }] },
          Priya: { enrolled: true, overall: 60, byTypology: {}, byDifficulty: {}, byType: {}, byTopic: {}, byTopicDifficulty: {}, trend: [], priority: [],
            questions: [{ test: 't1', topic: 'T', qno: 'Q1', difficulty: 'Easy', typology: 'Applying', type: 'MCQ', score: 1, marks: 1, accuracy: 100 }] },
          Zoe: { enrolled: true, overall: null, byTypology: {}, byDifficulty: {}, byType: {}, byTopic: {}, byTopicDifficulty: {}, trend: [], priority: [], questions: [] },
        },
        testOrder: ['t1'],
        testLabels: { t1: 'Test 1' },
        topics: ['T'],
        typologies: ['Applying'],
        leaderboard: [],
        trackingOnlyExtra: { testOrder: [], testLabels: {}, submissions: {} },
      },
    },
    trackingOnly: {},
    combinedOverall: {
      classOverall: 66.7,
      students: { Asha: 80, Rahul: 60, Priya: 60, Zoe: null },
    },
  }
}

describe('buildCombinedLeaderboard', () => {
  it('ranks students by combinedOverall percentage, best first', () => {
    const entries = buildCombinedLeaderboard(baseData())
    expect(entries[0].student).toBe('Asha')
    expect(entries[0].rank).toBe(1)
    expect(entries[0].adjustedPct).toBe(80)
  })

  it('tie-breaks equal combinedOverall by tests taken, then alphabetically', () => {
    const entries = buildCombinedLeaderboard(baseData())
    const rahul = entries.find((e) => e.student === 'Rahul')!
    const priya = entries.find((e) => e.student === 'Priya')!
    // Equal overall (60) and equal testsTaken (1 each) -> alphabetical: Priya before Rahul.
    expect(entries.indexOf(priya)).toBeLessThan(entries.indexOf(rahul))
  })

  it('gives rank: null to a student with no combinedOverall (zero attempts anywhere)', () => {
    const entries = buildCombinedLeaderboard(baseData())
    const zoe = entries.find((e) => e.student === 'Zoe')!
    expect(zoe.rank).toBeNull()
  })

  it('includes every student in the roster, ranked or not', () => {
    const entries = buildCombinedLeaderboard(baseData())
    expect(entries.map((e) => e.student).sort()).toEqual(['Asha', 'Priya', 'Rahul', 'Zoe'])
  })
})
