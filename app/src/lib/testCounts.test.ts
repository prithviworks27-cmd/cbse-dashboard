import { describe, it, expect } from 'vitest'
import { studentTestCounts, classTestCounts } from './testCounts'
import type { DashboardData } from '../types/dashboard'

function baseData(): DashboardData {
  return {
    school: 'Test School',
    className: 'X',
    subjects: ['Physics', 'Chemistry'],
    subjectsWithScores: ['Physics'],
    students: ['Asha', 'Priya'],
    subjectEnrollment: { Asha: ['Physics', 'Chemistry'], Priya: ['Chemistry'] },
    scored: {
      Physics: {
        classAvg: { byTypology: {}, byDifficulty: {}, byType: {}, overall: 70, submittedCount: 1, totalStudents: 1, totalTests: 2, totalMarksAllTests: 100 },
        students: {
          Asha: {
            enrolled: true,
            overall: 80,
            byTypology: {},
            byDifficulty: {},
            byType: {},
            byTopic: {},
            byTopicDifficulty: {},
            trend: [],
            priority: [],
            questions: [{ test: 't1', topic: 'Motion', qno: 'Q1', difficulty: 'Easy', typology: 'Applying', type: 'MCQ', score: 4, marks: 5, accuracy: 80 }],
          },
        },
        testOrder: ['t1', 't2'],
        testLabels: { t1: 'Test 1', t2: 'Test 2' },
        topics: ['Motion'],
        typologies: ['Applying'],
        leaderboard: [],
        trackingOnlyExtra: { testOrder: [], testLabels: {}, submissions: {} },
      },
    },
    trackingOnly: {
      Chemistry: { testOrder: ['c1'], testLabels: { c1: 'Chem Test 1' }, submissions: { Asha: ['c1'] } },
    },
    combinedOverall: { classOverall: null, students: {} },
  }
}

describe('studentTestCounts', () => {
  it('counts a scored test as taken only if the student has question rows for it', () => {
    const { taken, due } = studentTestCounts(baseData(), 'Asha')
    expect(taken).toContain('Test 1')
    expect(due).toContain('Test 2')
  })

  it('includes tracking-only submissions in taken/due', () => {
    const { taken } = studentTestCounts(baseData(), 'Asha')
    expect(taken).toContain('Chem Test 1')
  })

  it('only counts tests in subjects the student is enrolled in', () => {
    const { taken, due } = studentTestCounts(baseData(), 'Priya')
    expect(taken).not.toContain('Test 1')
    expect(due).not.toContain('Test 2')
  })
})

describe('classTestCounts', () => {
  it('averages taken/due across the whole roster', () => {
    const { avgTaken, avgDue } = classTestCounts(baseData())
    expect(avgTaken).toBeGreaterThan(0)
    expect(avgDue).toBeGreaterThanOrEqual(0)
  })
})
