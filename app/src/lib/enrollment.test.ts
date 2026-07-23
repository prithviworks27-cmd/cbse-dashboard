import { describe, it, expect } from 'vitest'
import { subjectStatus, subjectSnapshotLabel, enrolledStudents } from './enrollment'
import type { DashboardData } from '../types/dashboard'

function baseData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    school: 'Test School',
    className: 'X',
    subjects: ['Physics', 'Chemistry', 'Maths'],
    subjectsWithScores: ['Physics'],
    students: ['Asha', 'Rahul', 'Priya'],
    subjectEnrollment: {
      Asha: ['Physics', 'Chemistry'],
      Rahul: ['Physics', 'Chemistry', 'Maths'],
      Priya: ['Maths'],
    },
    scored: {
      Physics: {
        classAvg: {
          byTypology: {},
          byDifficulty: {},
          byType: {},
          overall: 70,
          submittedCount: 2,
          totalStudents: 2,
          totalTests: 3,
          totalMarksAllTests: 300,
        },
        students: {
          Asha: {
            enrolled: true,
            overall: 82,
            byTypology: {},
            byDifficulty: {},
            byType: {},
            byTopic: {},
            byTopicDifficulty: {},
            trend: [],
            priority: [],
            questions: [],
          },
        },
        testOrder: [],
        testLabels: {},
        topics: [],
        typologies: [],
        leaderboard: [],
        trackingOnlyExtra: { testOrder: [], testLabels: {}, submissions: {} },
      },
    },
    trackingOnly: {
      Chemistry: { testOrder: ['t1'], testLabels: { t1: 'Test 1' }, submissions: { Asha: ['t1'] } },
    },
    combinedOverall: { classOverall: null, students: {} },
    ...overrides,
  }
}

describe('subjectStatus', () => {
  const data = baseData()

  it('returns not-enrolled for a student not on the subject roster', () => {
    expect(subjectStatus(data, 'Physics', 'Priya')).toBe('not-enrolled')
  })

  it('returns scored when the subject has scored data', () => {
    expect(subjectStatus(data, 'Physics', 'Asha')).toBe('scored')
  })

  it('returns tracking-only when the subject only has a submission grid', () => {
    expect(subjectStatus(data, 'Chemistry', 'Asha')).toBe('tracking-only')
  })

  it('returns no-data when enrolled but subject has neither scored nor tracking data', () => {
    expect(subjectStatus(data, 'Maths', 'Rahul')).toBe('no-data')
  })
})

describe('subjectSnapshotLabel', () => {
  it('renders four distinct strings for the four states', () => {
    const labels = new Set([
      subjectSnapshotLabel('not-enrolled', null),
      subjectSnapshotLabel('no-data', null),
      subjectSnapshotLabel('tracking-only', null),
      subjectSnapshotLabel('scored', 91.2),
    ])
    expect(labels.size).toBe(4)
  })

  it('never renders a bare "%" or NaN for a scored student with no submissions', () => {
    const label = subjectSnapshotLabel('scored', null)
    expect(label).not.toMatch(/NaN/)
    expect(label).not.toBe('%')
  })
})

describe('enrolledStudents', () => {
  it('excludes students not on the subject roster', () => {
    const data = baseData()
    expect(enrolledStudents(data, 'Maths')).toEqual(['Rahul', 'Priya'])
    expect(enrolledStudents(data, 'Maths')).not.toContain('Asha')
  })
})
